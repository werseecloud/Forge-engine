use anyhow::Result;
use chrono::Utc;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use crate::models::installer::InstallConfig;
use crate::models::manifest::{InstallManifest, InstalledComponentManifest};
use crate::services::installer_system_service::{get_windows_user_paths, ENGINE_VERSION};
use crate::utils::paths::write_json_pretty;

pub fn build_manifest(config: &InstallConfig) -> Result<InstallManifest> {
    let paths = get_windows_user_paths()?;
    let mut components = BTreeMap::new();
    for component in config.selected_components.iter().filter(|c| c.selected && !c.binary_name.is_empty()) {
        components.insert(component.id.clone(), InstalledComponentManifest {
            display_name: component.display_name.clone(),
            version: ENGINE_VERSION.to_string(),
            path: format!("bin\\{}", component.binary_name),
            required: component.required,
            size_bytes: component.size_bytes,
            health_check: "--health-check".to_string(),
        });
    }
    let mut folders = BTreeMap::new();
    folders.insert("projects".to_string(), config.project_folder.clone());
    folders.insert("cache".to_string(), paths.cache_dir);
    folders.insert("logs".to_string(), paths.logs_dir);
    folders.insert("shader_cache".to_string(), paths.shader_cache_dir);
    folders.insert("asset_cache".to_string(), paths.asset_cache_dir);
    folders.insert("build_cache".to_string(), paths.build_cache_dir);

    Ok(InstallManifest {
        engine_name: "Forge Engine".to_string(),
        engine_version: ENGINE_VERSION.to_string(),
        install_id: uuid::Uuid::new_v4().to_string(),
        installed_at: Utc::now().to_rfc3339(),
        install_path: config.install_path.clone(),
        bin_path: Path::new(&config.install_path).join("bin").to_string_lossy().to_string(),
        default_projects_dir: config.project_folder.clone(),
        components,
        folders,
    })
}

pub fn write_manifest(config: &InstallConfig) -> Result<String> {
    let manifest = build_manifest(config)?;
    let path = Path::new(&config.install_path).join("manifest.json");
    write_json_pretty(&path, &manifest)?;
    Ok(path.to_string_lossy().to_string())
}

pub fn read_manifest(path: String) -> Result<InstallManifest> {
    Ok(serde_json::from_slice(&fs::read(path)?)?)
}

pub fn write_version_file(config: &InstallConfig) -> Result<String> {
    let path = Path::new(&config.install_path).join("version.json");
    write_json_pretty(&path, &serde_json::json!({
        "engine_name": "Forge Engine",
        "engine_version": ENGINE_VERSION,
        "written_at": Utc::now().to_rfc3339()
    }))?;
    Ok(path.to_string_lossy().to_string())
}

pub fn read_version_file(path: String) -> Result<serde_json::Value> {
    Ok(serde_json::from_slice(&fs::read(path)?)?)
}

