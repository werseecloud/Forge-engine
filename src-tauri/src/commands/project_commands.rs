use std::process::Command;

use crate::models::project::{
    CreateProjectRequest, OpenProjectResponse, ProjectSummary, ProjectValidation,
};
use crate::services::project_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn create_project(request: CreateProjectRequest) -> CommandResult<OpenProjectResponse> {
    project_service::create_project(request).map_err(command_error)
}

#[tauri::command]
pub fn open_project(path: String) -> CommandResult<OpenProjectResponse> {
    project_service::open_project(path).map_err(command_error)
}

#[tauri::command]
pub fn close_project() -> CommandResult<()> {
    project_service::close_project().map_err(command_error)
}

#[tauri::command]
pub fn list_recent_projects() -> CommandResult<Vec<ProjectSummary>> {
    project_service::list_recent_projects().map_err(command_error)
}

#[tauri::command]
pub fn pin_project(root_path: String) -> CommandResult<Vec<ProjectSummary>> {
    project_service::pin_project(root_path).map_err(command_error)
}

#[tauri::command]
pub fn unpin_project(root_path: String) -> CommandResult<Vec<ProjectSummary>> {
    project_service::unpin_project(root_path).map_err(command_error)
}

#[tauri::command]
pub fn reveal_project_in_explorer(root_path: String) -> CommandResult<()> {
    Command::new("explorer")
        .arg(root_path)
        .spawn()
        .map_err(command_error)?;
    Ok(())
}

#[tauri::command]
pub fn validate_project_path(path: String) -> CommandResult<ProjectValidation> {
    Ok(project_service::validate_project_path(path))
}

#[tauri::command]
pub fn repair_project_path(path: String) -> CommandResult<OpenProjectResponse> {
    project_service::repair_project_path(path).map_err(command_error)
}

