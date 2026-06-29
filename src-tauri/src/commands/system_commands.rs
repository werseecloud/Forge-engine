use crate::models::checks::{CheckResult, UserPaths};
use crate::models::installer::{ExistingInstall, PathValidation};
use crate::services::installer_system_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn run_system_check(install_path: Option<String>, project_folder: Option<String>) -> CommandResult<Vec<CheckResult>> {
    installer_system_service::run_system_check(install_path, project_folder).map_err(command_error)
}

#[tauri::command]
pub fn check_existing_install(path: Option<String>) -> CommandResult<ExistingInstall> {
    installer_system_service::check_existing_install(path).map_err(command_error)
}

#[tauri::command]
pub fn get_windows_user_paths() -> CommandResult<UserPaths> {
    installer_system_service::get_windows_user_paths().map_err(command_error)
}

#[tauri::command]
pub fn calculate_available_disk_space(path: String) -> CommandResult<u64> {
    installer_system_service::calculate_available_disk_space(path).map_err(command_error)
}

#[tauri::command]
pub fn validate_install_path(path: String) -> CommandResult<PathValidation> {
    installer_system_service::validate_install_path(path).map_err(command_error)
}

#[tauri::command]
pub fn validate_project_folder(path: String, install_path: String) -> CommandResult<PathValidation> {
    installer_system_service::validate_project_folder(path, install_path).map_err(command_error)
}

