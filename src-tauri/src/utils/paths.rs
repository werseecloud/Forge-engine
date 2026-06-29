use anyhow::{anyhow, Result};
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::fs::AppDirectories;

pub const ENGINE_VERSION: &str = "1.0.0";

pub fn app_directories() -> Result<AppDirectories> {
    let documents = dirs::document_dir().ok_or_else(|| anyhow!("Documents folder was not found"))?;
    let local = dirs::data_local_dir().ok_or_else(|| anyhow!("Local app data folder was not found"))?;
    let roaming = dirs::config_dir().ok_or_else(|| anyhow!("Roaming app data folder was not found"))?;

    let documents_root = documents.join("Forge Engine");
    let projects_dir = documents_root.join("Projects");
    let templates_dir = documents_root.join("Templates");
    let backups_dir = documents_root.join("Backups");

    let local_root = local.join("ForgeEngine");
    let cache_dir = local_root.join("Cache");
    let logs_dir = local_root.join("Logs");
    let shader_cache_dir = local_root.join("ShaderCache");
    let temp_dir = local_root.join("Temp");

    let roaming_root = roaming.join("ForgeEngine");
    let settings_path = roaming_root.join("settings.json");

    Ok(AppDirectories {
        documents_root: documents_root.to_string_lossy().to_string(),
        projects_dir: projects_dir.to_string_lossy().to_string(),
        templates_dir: templates_dir.to_string_lossy().to_string(),
        backups_dir: backups_dir.to_string_lossy().to_string(),
        local_root: local_root.to_string_lossy().to_string(),
        cache_dir: cache_dir.to_string_lossy().to_string(),
        logs_dir: logs_dir.to_string_lossy().to_string(),
        shader_cache_dir: shader_cache_dir.to_string_lossy().to_string(),
        temp_dir: temp_dir.to_string_lossy().to_string(),
        roaming_root: roaming_root.to_string_lossy().to_string(),
        settings_path: settings_path.to_string_lossy().to_string(),
    })
}

pub fn ensure_app_directories() -> Result<AppDirectories> {
    let dirs = app_directories()?;
    for path in [
        &dirs.documents_root,
        &dirs.projects_dir,
        &dirs.templates_dir,
        &dirs.backups_dir,
        &dirs.local_root,
        &dirs.cache_dir,
        &dirs.logs_dir,
        &dirs.shader_cache_dir,
        &dirs.temp_dir,
        &dirs.roaming_root,
    ] {
        fs::create_dir_all(path)?;
    }
    Ok(dirs)
}

pub fn sanitize_name(name: &str) -> String {
    let mut value = name
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' || character == ' ' {
                character
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim()
        .to_string();

    while value.contains("  ") {
        value = value.replace("  ", " ");
    }

    if value.is_empty() {
        "Untitled".to_string()
    } else {
        value
    }
}

pub fn sanitize_file_stem(name: &str) -> String {
    sanitize_name(name).replace(' ', "_")
}

pub fn normalize_relative_path(path: &Path, root: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

pub fn ensure_within(root: &Path, candidate: &Path) -> Result<PathBuf> {
    let root = root.canonicalize()?;
    let candidate = if candidate.exists() {
        candidate.canonicalize()?
    } else {
        let parent = candidate
            .parent()
            .ok_or_else(|| anyhow!("Path has no parent: {}", candidate.display()))?;
        parent.canonicalize()?.join(
            candidate
                .file_name()
                .ok_or_else(|| anyhow!("Path has no file name: {}", candidate.display()))?,
        )
    };

    if candidate.starts_with(&root) {
        Ok(candidate)
    } else {
        Err(anyhow!(
            "Path is outside the project folder: {}",
            candidate.display()
        ))
    }
}

pub fn write_json_pretty<T: serde::Serialize>(path: &Path, value: &T) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, serde_json::to_vec_pretty(value)?)?;
    Ok(())
}

pub fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T> {
    let bytes = fs::read(path)?;
    Ok(serde_json::from_slice(&bytes)?)
}

