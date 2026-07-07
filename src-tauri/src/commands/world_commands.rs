use crate::models::world::{CreateWorldRequest, CreateWorldResult, WorldAssetManifest};
use crate::services::world_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_world(request: CreateWorldRequest) -> CommandResult<CreateWorldResult> {
    world_service::create_world(request).map_err(command_error)
}

#[tauri::command]
pub fn discover_world_assets() -> CommandResult<WorldAssetManifest> {
    world_service::discover_world_assets().map_err(command_error)
}
