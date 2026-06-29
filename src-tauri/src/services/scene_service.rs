use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::models::scene::{
    CreateLevelRequest, LevelSummary, SceneLevel, SceneObject, Transform, Vec3, WorldLayer,
};
use crate::services::log_service;
use crate::utils::ids::new_id;
use crate::utils::paths::{
    ensure_within, normalize_relative_path, read_json, sanitize_file_stem, write_json_pretty,
};

pub fn create_level(request: CreateLevelRequest) -> Result<SceneLevel> {
    let level = create_level_at_root(Path::new(&request.project_root), &request.name)?;
    log_service::append_output_log(&format!("Created level '{}'", level.name))?;
    Ok(open_level(request.project_root, level.relative_path)?)
}

pub fn create_level_at_root(project_root: &Path, name: &str) -> Result<LevelSummary> {
    let scenes_dir = project_root.join("Content/Scenes");
    fs::create_dir_all(&scenes_dir)?;
    let file_stem = sanitize_file_stem(name);
    let mut path = scenes_dir.join(format!("{}.forge_scene", file_stem));
    if path.exists() {
        for index in 1..1000 {
            let candidate = scenes_dir.join(format!("{}_{}.forge_scene", file_stem, index));
            if !candidate.exists() {
                path = candidate;
                break;
            }
        }
    }

    let now = Utc::now().to_rfc3339();
    let level = SceneLevel {
        level_id: new_id("level"),
        name: name.to_string(),
        path: path.to_string_lossy().to_string(),
        created_at: now.clone(),
        updated_at: now,
        layers: vec![WorldLayer {
            id: new_id("layer"),
            name: "Default Layer".to_string(),
            visible: true,
            color: "#2997FF".to_string(),
        }],
        objects: Vec::new(),
    };
    write_json_pretty(&path, &level)?;
    level_summary(project_root, &path)
}

pub fn open_level(project_root: String, level_path: String) -> Result<SceneLevel> {
    let path = resolve_level_path(&project_root, &level_path)?;
    let mut level: SceneLevel = read_json(&path)?;
    level.path = path.to_string_lossy().to_string();
    Ok(level)
}

pub fn save_level(project_root: String, mut level: SceneLevel) -> Result<SceneLevel> {
    let path = resolve_level_path(&project_root, &level.path)?;
    level.updated_at = Utc::now().to_rfc3339();
    level.path = path.to_string_lossy().to_string();
    write_json_pretty(&path, &level)?;
    Ok(level)
}

pub fn list_levels(project_root: String) -> Result<Vec<LevelSummary>> {
    let root = PathBuf::from(&project_root);
    let content = root.join("Content");
    let mut levels = Vec::new();
    if !content.exists() {
        return Ok(levels);
    }
    for entry in WalkDir::new(content).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let name = path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
        if name.ends_with(".forge_scene") || name.ends_with(".forge_level") {
            levels.push(level_summary(&root, path)?);
        }
    }
    levels.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(levels)
}

pub fn update_scene_object(
    project_root: String,
    level_path: String,
    object: SceneObject,
) -> Result<SceneLevel> {
    let mut level = open_level(project_root.clone(), level_path.clone())?;
    let Some(existing) = level.objects.iter_mut().find(|item| item.id == object.id) else {
        return Err(anyhow!("Scene object not found: {}", object.id));
    };
    *existing = object;
    save_level(project_root, level)
}

pub fn add_scene_object(
    project_root: String,
    level_path: String,
    name: String,
    asset_reference: Option<String>,
) -> Result<SceneLevel> {
    let mut level = open_level(project_root.clone(), level_path.clone())?;
    let layer = level.layers.first().map(|item| item.id.clone());
    level.objects.push(SceneObject {
        id: new_id("entity"),
        name,
        tags: Vec::new(),
        layer,
        visible: true,
        asset_reference,
        transform: Some(Transform {
            position: Vec3 { x: 0.0, y: 0.0, z: 0.0 },
            rotation: Vec3 { x: 0.0, y: 0.0, z: 0.0 },
            scale: Vec3 { x: 1.0, y: 1.0, z: 1.0 },
        }),
        components: Vec::new(),
    });
    save_level(project_root, level)
}

pub fn delete_scene_object(project_root: String, level_path: String, object_id: String) -> Result<SceneLevel> {
    let mut level = open_level(project_root.clone(), level_path.clone())?;
    level.objects.retain(|object| object.id != object_id);
    save_level(project_root, level)
}

pub fn select_scene_object(
    project_root: String,
    level_path: String,
    object_id: String,
) -> Result<Option<SceneObject>> {
    let level = open_level(project_root, level_path)?;
    Ok(level.objects.into_iter().find(|object| object.id == object_id))
}

fn resolve_level_path(project_root: &str, level_path: &str) -> Result<PathBuf> {
    let root = Path::new(project_root);
    let content = root.join("Content");
    let path = PathBuf::from(level_path);
    let absolute = if path.is_absolute() {
        path
    } else {
        content.join(level_path.trim_start_matches("Content"))
    };
    ensure_within(&content, &absolute)
}

fn level_summary(project_root: &Path, path: &Path) -> Result<LevelSummary> {
    let metadata = fs::metadata(path)?;
    let modified = metadata
        .modified()
        .ok()
        .map(DateTime::<Utc>::from)
        .unwrap_or_else(Utc::now)
        .to_rfc3339();
    let level: Option<SceneLevel> = read_json(path).ok();
    Ok(LevelSummary {
        level_id: level
            .as_ref()
            .map(|item| item.level_id.clone())
            .unwrap_or_else(|| new_id("level")),
        name: level
            .map(|item| item.name)
            .unwrap_or_else(|| path.file_stem().unwrap_or_default().to_string_lossy().to_string()),
        path: path.to_string_lossy().to_string(),
        relative_path: normalize_relative_path(path, &project_root.join("Content")),
        modified_at: modified,
    })
}

