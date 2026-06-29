use crate::models::settings::AppSettings;
use crate::services::settings_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn get_settings() -> CommandResult<AppSettings> {
    settings_service::load_settings().map_err(command_error)
}

#[tauri::command]
pub fn update_settings(settings: AppSettings) -> CommandResult<AppSettings> {
    settings_service::save_settings(&settings).map_err(command_error)
}

#[tauri::command]
pub fn reset_settings() -> CommandResult<AppSettings> {
    let settings = settings_service::default_settings().map_err(command_error)?;
    settings_service::save_settings(&settings).map_err(command_error)
}

#[tauri::command]
pub fn set_default_projects_dir(path: String) -> CommandResult<AppSettings> {
    let mut settings = settings_service::load_settings().map_err(command_error)?;
    settings.default_projects_dir = path;
    settings_service::save_settings(&settings).map_err(command_error)
}

