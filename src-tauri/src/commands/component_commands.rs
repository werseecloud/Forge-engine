use crate::models::component::InstallerComponent;
use crate::models::installer::{InstallConfig, InstallPlan};
use crate::services::{installer_component_service, installer_service};
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn scan_available_components(install_path: String) -> CommandResult<Vec<InstallerComponent>> {
    installer_component_service::scan_available_components(install_path).map_err(command_error)
}

#[tauri::command]
pub fn calculate_component_size(component_id: String) -> CommandResult<u64> {
    installer_component_service::calculate_component_size(component_id).map_err(command_error)
}

#[tauri::command]
pub fn validate_component_sources(install_path: String) -> CommandResult<Vec<InstallerComponent>> {
    installer_component_service::validate_component_sources(install_path).map_err(command_error)
}

#[tauri::command]
pub fn get_component_install_plan(config: InstallConfig) -> CommandResult<InstallPlan> {
    installer_service::create_install_plan(config).map_err(command_error)
}

