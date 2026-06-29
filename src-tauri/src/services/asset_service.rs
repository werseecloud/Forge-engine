use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::models::asset::{AssetIndex, AssetMetadata, ImportAssetsRequest, ImportResult};
use crate::services::log_service;
use crate::utils::ids::new_id;
use crate::utils::paths::{
    ensure_within, normalize_relative_path, read_json, write_json_pretty, ENGINE_VERSION,
};

const ALLOWED_EXTENSIONS: &[&str] = &[
    "glb",
    "gltf",
    "fbx",
    "obj",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "hdr",
    "exr",
    "wav",
    "mp3",
    "ogg",
    "json",
    "ron",
    "toml",
    "txt",
    "md",
    "forge_scene",
    "forge_level",
    "forge_blueprint",
    "forge_material",
    "forge_prefab",
];

pub fn import_assets(request: ImportAssetsRequest) -> Result<ImportResult> {
    let project_root = PathBuf::from(&request.project_root);
    let content_root = project_root.join("Content");
    let destination = content_root.join(request.destination_relative.trim_start_matches("Content"));
    let destination = ensure_within(&content_root, &destination)?;
    fs::create_dir_all(&destination)?;

    let mut imported = Vec::new();
    let mut skipped = Vec::new();
    let mut errors = Vec::new();

    for source in request.source_paths {
        let source_path = PathBuf::from(&source);
        if !source_path.exists() || !source_path.is_file() {
            errors.push(format!("Source file does not exist: {}", source));
            continue;
        }

        let extension = extension_for(&source_path);
        if !is_supported_extension(&extension) {
            skipped.push(format!("Unsupported file type: {}", source_path.display()));
            continue;
        }

        let file_name = match source_path.file_name() {
            Some(name) => name.to_owned(),
            None => {
                errors.push(format!("Source path has no file name: {}", source_path.display()));
                continue;
            }
        };

        let mut target = destination.join(&file_name);
        if target.exists() {
            match request.conflict_strategy.as_str() {
                "replace" => {}
                "keepBoth" => target = keep_both_path(&target),
                "skip" => {
                    skipped.push(target.to_string_lossy().to_string());
                    continue;
                }
                other => {
                    errors.push(format!("Unknown conflict strategy: {}", other));
                    continue;
                }
            }
        }

        match fs::copy(&source_path, &target) {
            Ok(_) => match metadata_for_file(&project_root, &target, Some(&source_path)) {
                Ok(metadata) => {
                    if let Err(error) = write_metadata_sidecar(&target, &metadata) {
                        errors.push(error.to_string());
                    } else {
                        imported.push(metadata);
                    }
                }
                Err(error) => errors.push(error.to_string()),
            },
            Err(error) => errors.push(format!("Failed to copy {}: {}", source_path.display(), error)),
        }
    }

    let _ = rebuild_asset_index(request.project_root.clone());
    log_service::append_output_log(&format!(
        "Asset import finished: {} imported, {} skipped, {} errors",
        imported.len(),
        skipped.len(),
        errors.len()
    ))?;

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}

pub fn scan_assets(project_root: String) -> Result<AssetIndex> {
    rebuild_asset_index(project_root)
}

pub fn rebuild_asset_index(project_root: String) -> Result<AssetIndex> {
    let project_root_path = PathBuf::from(&project_root);
    let content_root = project_root_path.join("Content");
    fs::create_dir_all(&content_root)?;

    let mut assets = Vec::new();
    for entry in WalkDir::new(&content_root).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file() || is_sidecar(path) {
            continue;
        }
        let extension = extension_for(path);
        if !is_supported_extension(&extension) {
            continue;
        }
        let metadata = metadata_for_file(&project_root_path, path, None)?;
        write_metadata_sidecar(path, &metadata)?;
        assets.push(metadata);
    }

    assets.sort_by(|a, b| a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase()));
    let index = AssetIndex {
        project_root: project_root.clone(),
        rebuilt_at: Utc::now().to_rfc3339(),
        assets,
    };
    write_json_pretty(&project_root_path.join(".forge/asset_index.json"), &index)?;
    Ok(index)
}

pub fn get_asset_metadata(project_root: String, relative_path: String) -> Result<AssetMetadata> {
    let path = asset_path(&project_root, &relative_path)?;
    let sidecar = sidecar_path(&path);
    if sidecar.exists() {
        read_json(&sidecar)
    } else {
        metadata_for_file(Path::new(&project_root), &path, None)
    }
}

pub fn update_asset_metadata(
    project_root: String,
    relative_path: String,
    metadata: AssetMetadata,
) -> Result<AssetMetadata> {
    let path = asset_path(&project_root, &relative_path)?;
    write_metadata_sidecar(&path, &metadata)?;
    rebuild_asset_index(project_root)?;
    Ok(metadata)
}

pub fn delete_asset(project_root: String, relative_path: String) -> Result<AssetIndex> {
    let path = asset_path(&project_root, &relative_path)?;
    if path.exists() {
        fs::remove_file(&path)?;
    }
    let sidecar = sidecar_path(&path);
    if sidecar.exists() {
        fs::remove_file(sidecar)?;
    }
    rebuild_asset_index(project_root)
}

pub fn rename_asset(project_root: String, relative_path: String, new_name: String) -> Result<AssetIndex> {
    let path = asset_path(&project_root, &relative_path)?;
    let target = path.with_file_name(new_name);
    let content_root = Path::new(&project_root).join("Content");
    ensure_within(&content_root, &target)?;
    fs::rename(&path, &target)?;
    move_sidecar(&path, &target)?;
    rebuild_asset_index(project_root)
}

pub fn move_asset(
    project_root: String,
    relative_path: String,
    destination_relative: String,
) -> Result<AssetIndex> {
    let path = asset_path(&project_root, &relative_path)?;
    let content_root = Path::new(&project_root).join("Content");
    let destination = content_root.join(destination_relative.trim_start_matches("Content"));
    let destination = ensure_within(&content_root, &destination)?;
    fs::create_dir_all(&destination)?;
    let target = destination.join(path.file_name().ok_or_else(|| anyhow!("Asset has no file name"))?);
    fs::rename(&path, &target)?;
    move_sidecar(&path, &target)?;
    rebuild_asset_index(project_root)
}

pub fn duplicate_asset(project_root: String, relative_path: String) -> Result<AssetIndex> {
    let path = asset_path(&project_root, &relative_path)?;
    let target = keep_both_path(&path);
    fs::copy(&path, &target)?;
    let metadata = metadata_for_file(Path::new(&project_root), &target, Some(&path))?;
    write_metadata_sidecar(&target, &metadata)?;
    rebuild_asset_index(project_root)
}

fn metadata_for_file(project_root: &Path, path: &Path, source_path: Option<&Path>) -> Result<AssetMetadata> {
    let sidecar = sidecar_path(path);
    let existing: Option<AssetMetadata> = if sidecar.exists() {
        read_json(&sidecar).ok()
    } else {
        None
    };
    let metadata = fs::metadata(path)?;
    let modified = metadata
        .modified()
        .ok()
        .map(DateTime::<Utc>::from)
        .unwrap_or_else(Utc::now)
        .to_rfc3339();

    let extension = extension_for(path);
    Ok(AssetMetadata {
        asset_id: existing
            .as_ref()
            .map(|item| item.asset_id.clone())
            .unwrap_or_else(|| new_id("asset")),
        file_name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        relative_path: normalize_relative_path(path, &project_root.join("Content")),
        asset_type: asset_type_for_extension(&extension).to_string(),
        file_size: metadata.len(),
        extension,
        imported_at: existing
            .as_ref()
            .map(|item| item.imported_at.clone())
            .unwrap_or_else(|| Utc::now().to_rfc3339()),
        modified_at: modified,
        source_path_hash: hash_source(source_path.unwrap_or(path)),
        thumbnail_path: existing.and_then(|item| item.thumbnail_path),
        tags: Vec::new(),
        import_settings: serde_json::json!({}),
        dependencies: Vec::new(),
        engine_version: ENGINE_VERSION.to_string(),
    })
}

fn write_metadata_sidecar(path: &Path, metadata: &AssetMetadata) -> Result<()> {
    write_json_pretty(&sidecar_path(path), metadata)
}

fn move_sidecar(source: &Path, target: &Path) -> Result<()> {
    let source_sidecar = sidecar_path(source);
    if source_sidecar.exists() {
        fs::rename(source_sidecar, sidecar_path(target))?;
    }
    Ok(())
}

fn sidecar_path(path: &Path) -> PathBuf {
    PathBuf::from(format!("{}.forge_meta", path.to_string_lossy()))
}

fn asset_path(project_root: &str, relative_path: &str) -> Result<PathBuf> {
    let content_root = Path::new(project_root).join("Content");
    let path = content_root.join(relative_path.trim_start_matches("Content"));
    ensure_within(&content_root, &path)
}

fn is_sidecar(path: &Path) -> bool {
    path.to_string_lossy().ends_with(".forge_meta")
}

fn keep_both_path(path: &Path) -> PathBuf {
    let parent = path.parent().unwrap_or_else(|| Path::new(""));
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let extension = path.extension().map(|ext| ext.to_string_lossy().to_string());
    for index in 1..1000 {
        let name = match &extension {
            Some(ext) => format!("{} ({}){}", stem, index, format!(".{}", ext)),
            None => format!("{} ({})", stem, index),
        };
        let candidate = parent.join(name);
        if !candidate.exists() {
            return candidate;
        }
    }
    parent.join(format!("{} copy", stem))
}

fn extension_for(path: &Path) -> String {
    let name = path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
    for native in [
        ".forge_scene",
        ".forge_level",
        ".forge_blueprint",
        ".forge_material",
        ".forge_prefab",
    ] {
        if name.ends_with(native) {
            return native.trim_start_matches('.').to_string();
        }
    }
    path.extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase()
}

fn is_supported_extension(extension: &str) -> bool {
    ALLOWED_EXTENSIONS.contains(&extension)
}

fn asset_type_for_extension(extension: &str) -> &'static str {
    match extension {
        "glb" | "gltf" | "fbx" | "obj" => "Mesh",
        "png" | "jpg" | "jpeg" | "webp" | "hdr" | "exr" => "Texture",
        "wav" | "mp3" | "ogg" => "Audio",
        "forge_scene" | "forge_level" => "Scene",
        "forge_blueprint" => "Blueprint",
        "forge_material" => "Material",
        "forge_prefab" => "Prefab",
        "json" | "ron" | "toml" | "txt" | "md" => "Data",
        _ => "Unknown",
    }
}

fn hash_source(path: &Path) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.to_string_lossy().as_bytes());
    format!("{:x}", hasher.finalize())
}

