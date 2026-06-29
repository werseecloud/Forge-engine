use crate::models::scene::{CreateLevelRequest, LevelSummary, SceneLevel, SceneObject};
use crate::services::scene_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_level(request: CreateLevelRequest) -> CommandResult<SceneLevel> {
    scene_service::create_level(request).map_err(command_error)
}

#[tauri::command]
pub fn open_level(project_root: String, level_path: String) -> CommandResult<SceneLevel> {
    scene_service::open_level(project_root, level_path).map_err(command_error)
}

#[tauri::command]
pub fn save_level(project_root: String, level: SceneLevel) -> CommandResult<SceneLevel> {
    scene_service::save_level(project_root, level).map_err(command_error)
}

#[tauri::command]
pub fn list_levels(project_root: String) -> CommandResult<Vec<LevelSummary>> {
    scene_service::list_levels(project_root).map_err(command_error)
}

#[tauri::command]
pub fn update_scene_object(
    project_root: String,
    level_path: String,
    object: SceneObject,
) -> CommandResult<SceneLevel> {
    scene_service::update_scene_object(project_root, level_path, object).map_err(command_error)
}

#[tauri::command]
pub fn add_scene_object(
    project_root: String,
    level_path: String,
    name: String,
    asset_reference: Option<String>,
) -> CommandResult<SceneLevel> {
    scene_service::add_scene_object(project_root, level_path, name, asset_reference).map_err(command_error)
}

#[tauri::command]
pub fn delete_scene_object(
    project_root: String,
    level_path: String,
    object_id: String,
) -> CommandResult<SceneLevel> {
    scene_service::delete_scene_object(project_root, level_path, object_id).map_err(command_error)
}

#[tauri::command]
pub fn select_scene_object(
    project_root: String,
    level_path: String,
    object_id: String,
) -> CommandResult<Option<SceneObject>> {
    scene_service::select_scene_object(project_root, level_path, object_id).map_err(command_error)
}

