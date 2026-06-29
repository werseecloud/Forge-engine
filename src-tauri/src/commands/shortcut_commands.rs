use crate::models::installer::InstallConfig;
use crate::services::installer_shortcut_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_desktop_shortcut(config: InstallConfig) -> CommandResult<String> {
    installer_shortcut_service::create_desktop_shortcut(&config).map_err(command_error)
}

#[tauri::command]
pub fn create_start_menu_shortcuts(config: InstallConfig) -> CommandResult<Vec<String>> {
    installer_shortcut_service::create_start_menu_shortcuts(&config).map_err(command_error)
}

