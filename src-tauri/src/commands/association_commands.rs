use crate::models::installer::InstallConfig;
use crate::services::installer_association_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn register_file_associations(config: InstallConfig) -> CommandResult<Vec<String>> {
    installer_association_service::register_file_associations(&config).map_err(command_error)
}

#[tauri::command]
pub fn unregister_file_associations() -> CommandResult<()> {
    installer_association_service::unregister_file_associations().map_err(command_error)
}

