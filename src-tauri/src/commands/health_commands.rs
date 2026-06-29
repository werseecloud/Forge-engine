use crate::models::health::HealthCheckResult;
use crate::models::installer::InstallConfig;
use crate::services::installer_health_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn run_component_health_checks(config: InstallConfig) -> CommandResult<Vec<HealthCheckResult>> {
    installer_health_service::run_component_health_checks(&config).map_err(command_error)
}

#[tauri::command]
pub fn run_single_component_health_check(config: InstallConfig, component_id: String) -> CommandResult<HealthCheckResult> {
    installer_health_service::run_single_component_health_check(config, component_id).map_err(command_error)
}

