use anyhow::{anyhow, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeProjectManifest {
    pub project_name: String,
    pub engine_version: String,
    pub created_at: String,
    pub content_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetMetadata {
    pub asset_id: String,
    pub file_name: String,
    pub relative_path: String,
    pub asset_type: String,
    pub extension: String,
    pub file_size: u64,
    pub hash: String,
    pub imported_at: String,
    pub modified_at: String,
    pub source_path_hash: String,
    pub thumbnail_path: Option<String>,
    pub tags: Vec<String>,
    pub dependencies: Vec<String>,
    pub import_settings: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIndex {
    pub generated_at: String,
    pub assets: Vec<AssetMetadata>,
}

pub fn validate_project(root: &Path) -> Result<()> {
    if !root.exists() {
        return Err(anyhow!("MissingProject: {}", root.display()));
    }
    let manifest = root.join("ForgeProject.forge");
    if !manifest.exists() {
        return Err(anyhow!("ForgeProject.forge was not found in {}", root.display()));
    }
    Ok(())
}

pub fn content_dir(root: &Path) -> PathBuf {
    root.join("Content")
}

pub fn asset_index_path(root: &Path) -> PathBuf {
    root.join(".forge").join("asset_index.json")
}

pub fn scan_content(root: &Path) -> Result<AssetIndex> {
    validate_project(root)?;
    let content = content_dir(root);
    fs::create_dir_all(&content)?;
    let mut assets = Vec::new();
    for entry in WalkDir::new(&content).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file() || path.extension().and_then(|v| v.to_str()) == Some("forge_meta") {
            continue;
        }
        assets.push(metadata_for_file(root, path)?);
    }
    Ok(AssetIndex { generated_at: Utc::now().to_rfc3339(), assets })
}

pub fn write_asset_index(root: &Path, index: &AssetIndex) -> Result<PathBuf> {
    let path = asset_index_path(root);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&path, serde_json::to_vec_pretty(index)?)?;
    Ok(path)
}

pub fn metadata_for_file(project_root: &Path, path: &Path) -> Result<AssetMetadata> {
    let metadata = fs::metadata(path)?;
    let extension = path.extension().and_then(|v| v.to_str()).unwrap_or("").to_lowercase();
    let relative = path.strip_prefix(project_root)?.to_string_lossy().replace('/', "\\");
    let bytes = fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = format!("{:x}", hasher.finalize());
    Ok(AssetMetadata {
        asset_id: Uuid::new_v4().to_string(),
        file_name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        relative_path: relative,
        asset_type: classify_extension(&extension).to_string(),
        extension: format!(".{}", extension),
        file_size: metadata.len(),
        hash: hash.clone(),
        imported_at: Utc::now().to_rfc3339(),
        modified_at: metadata.modified().ok().map(chrono::DateTime::<Utc>::from).unwrap_or_else(Utc::now).to_rfc3339(),
        source_path_hash: hash,
        thumbnail_path: None,
        tags: Vec::new(),
        dependencies: Vec::new(),
        import_settings: serde_json::json!({}),
    })
}

pub fn classify_extension(extension: &str) -> &'static str {
    match extension {
        "glb" | "gltf" | "fbx" | "obj" => "mesh",
        "png" | "jpg" | "jpeg" | "webp" | "hdr" | "exr" => "texture",
        "wav" | "mp3" | "ogg" => "audio",
        "forge_scene" | "forge_level" => "scene",
        "forge_blueprint" => "blueprint",
        "forge_material" => "material",
        "forge_prefab" => "prefab",
        _ => "data",
    }
}
