use anyhow::Result;
use std::fs;
use std::path::Path;

use crate::models::installer::{InstallConfig, InstallerState};
use crate::services::installer_system_service::get_windows_user_paths;
use crate::utils::paths::write_json_pretty;

pub fn write_default_settings(config: &InstallConfig) -> Result<String> {
    let paths = get_windows_user_paths()?;
    let settings = serde_json::json!({
        "engine_install_path": config.install_path,
        "default_projects_dir": config.project_folder,
        "cache_dir": paths.cache_dir,
        "shader_cache_dir": paths.shader_cache_dir,
        "asset_cache_dir": paths.asset_cache_dir,
        "build_cache_dir": paths.build_cache_dir,
        "logs_dir": paths.logs_dir,
        "update_channel": "stable",
        "auto_update": true,
        "first_launch": true,
        "theme": "dark"
    });
    write_json_pretty(Path::new(&paths.settings_path), &settings)?;
    write_json_pretty(Path::new(&paths.roaming_root).join("recent_projects.json").as_path(), &serde_json::json!([]))?;
    write_json_pretty(Path::new(&paths.roaming_root).join("editor_layout.json").as_path(), &serde_json::json!({}))?;
    Ok(paths.settings_path)
}

pub fn read_settings() -> Result<serde_json::Value> {
    let paths = get_windows_user_paths()?;
    Ok(serde_json::from_slice(&fs::read(paths.settings_path)?)?)
}

pub fn update_settings(settings: serde_json::Value) -> Result<serde_json::Value> {
    let paths = get_windows_user_paths()?;
    write_json_pretty(Path::new(&paths.settings_path), &settings)?;
    Ok(settings)
}

pub fn write_installer_state(state: &InstallerState) -> Result<String> {
    let paths = get_windows_user_paths()?;
    write_json_pretty(Path::new(&paths.installer_state_path), state)?;
    Ok(paths.installer_state_path)
}

