use crate::models::installer::InstallConfig;
use crate::models::manifest::InstallManifest;
use crate::services::installer_manifest_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn write_manifest(config: InstallConfig) -> CommandResult<String> {
    installer_manifest_service::write_manifest(&config).map_err(command_error)
}

#[tauri::command]
pub fn read_manifest(path: String) -> CommandResult<InstallManifest> {
    installer_manifest_service::read_manifest(path).map_err(command_error)
}

#[tauri::command]
pub fn write_version_file(config: InstallConfig) -> CommandResult<String> {
    installer_manifest_service::write_version_file(&config).map_err(command_error)
}

#[tauri::command]
pub fn read_version_file(path: String) -> CommandResult<serde_json::Value> {
    installer_manifest_service::read_version_file(path).map_err(command_error)
}

