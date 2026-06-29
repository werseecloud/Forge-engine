use crate::models::installer::InstallConfig;
use crate::services::installer_folder_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_user_folders(config: InstallConfig) -> CommandResult<Vec<String>> {
    installer_folder_service::create_user_folders(&config).map_err(command_error)
}

#[tauri::command]
pub fn create_install_folders(config: InstallConfig) -> CommandResult<Vec<String>> {
    installer_folder_service::create_install_folders(&config).map_err(command_error)
}

#[tauri::command]
pub fn open_folder(path: String) -> CommandResult<()> {
    installer_folder_service::open_folder(path).map_err(command_error)
}

