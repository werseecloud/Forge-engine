use crate::models::world::{CreateWorldRequest, CreateWorldResult};
use crate::services::world_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_world(request: CreateWorldRequest) -> CommandResult<CreateWorldResult> {
    world_service::create_world(request).map_err(command_error)
}
