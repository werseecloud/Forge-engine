use crate::services::log_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn read_output_log() -> CommandResult<Vec<String>> {
    log_service::read_output_log().map_err(command_error)
}

#[tauri::command]
pub fn append_output_log(message: String) -> CommandResult<String> {
    log_service::append_output_log(&message).map_err(command_error)
}

#[tauri::command]
pub fn clear_output_log() -> CommandResult<()> {
    log_service::clear_output_log().map_err(command_error)
}

