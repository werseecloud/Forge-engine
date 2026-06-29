use crate::services::installer_log_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn read_installer_log() -> CommandResult<Vec<String>> {
    installer_log_service::read_installer_log().map_err(command_error)
}

#[tauri::command]
pub fn append_installer_log(message: String) -> CommandResult<String> {
    installer_log_service::append_installer_log(&message).map_err(command_error)
}

#[tauri::command]
pub fn clear_installer_log() -> CommandResult<()> {
    installer_log_service::clear_installer_log().map_err(command_error)
}
