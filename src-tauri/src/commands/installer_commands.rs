use crate::models::installer::{InstallConfig, InstallPlan, InstallResult};
use crate::services::installer_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_install_plan(config: InstallConfig) -> CommandResult<InstallPlan> {
    installer_service::create_install_plan(config).map_err(command_error)
}

#[tauri::command]
pub fn run_install_plan(app: tauri::AppHandle, config: InstallConfig) -> CommandResult<InstallResult> {
    installer_service::run_install_plan(app, config).map_err(command_error)
}

#[tauri::command]
pub fn cancel_install() -> CommandResult<()> {
    installer_service::cancel_install().map_err(command_error)
}

#[tauri::command]
pub fn repair_install(app: tauri::AppHandle, config: InstallConfig) -> CommandResult<InstallResult> {
    installer_service::repair_install(app, config).map_err(command_error)
}

#[tauri::command]
pub fn update_install(app: tauri::AppHandle, config: InstallConfig) -> CommandResult<InstallResult> {
    installer_service::update_install(app, config).map_err(command_error)
}

#[tauri::command]
pub fn uninstall_install(install_path: String, remove_user_data: bool) -> CommandResult<()> {
    installer_service::uninstall_install(install_path, remove_user_data).map_err(command_error)
}

