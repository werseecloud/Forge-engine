use crate::models::installer::InstallConfig;
use crate::services::installer_settings_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn write_default_settings(config: InstallConfig) -> CommandResult<String> {
    installer_settings_service::write_default_settings(&config).map_err(command_error)
}

#[tauri::command]
pub fn read_installer_settings() -> CommandResult<serde_json::Value> {
    installer_settings_service::read_settings().map_err(command_error)
}

#[tauri::command]
pub fn update_installer_settings(settings: serde_json::Value) -> CommandResult<serde_json::Value> {
    installer_settings_service::update_settings(settings).map_err(command_error)
}

