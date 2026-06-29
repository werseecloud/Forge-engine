use crate::models::asset::{AssetIndex, AssetMetadata, ImportAssetsRequest, ImportResult};
use crate::services::asset_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn import_assets(request: ImportAssetsRequest) -> CommandResult<ImportResult> {
    asset_service::import_assets(request).map_err(command_error)
}

#[tauri::command]
pub fn scan_assets(project_root: String) -> CommandResult<AssetIndex> {
    asset_service::scan_assets(project_root).map_err(command_error)
}

#[tauri::command]
pub fn rebuild_asset_index(project_root: String) -> CommandResult<AssetIndex> {
    asset_service::rebuild_asset_index(project_root).map_err(command_error)
}

#[tauri::command]
pub fn get_asset_metadata(project_root: String, relative_path: String) -> CommandResult<AssetMetadata> {
    asset_service::get_asset_metadata(project_root, relative_path).map_err(command_error)
}

#[tauri::command]
pub fn update_asset_metadata(
    project_root: String,
    relative_path: String,
    metadata: AssetMetadata,
) -> CommandResult<AssetMetadata> {
    asset_service::update_asset_metadata(project_root, relative_path, metadata).map_err(command_error)
}

#[tauri::command]
pub fn delete_asset(project_root: String, relative_path: String) -> CommandResult<AssetIndex> {
    asset_service::delete_asset(project_root, relative_path).map_err(command_error)
}

#[tauri::command]
pub fn rename_asset(
    project_root: String,
    relative_path: String,
    new_name: String,
) -> CommandResult<AssetIndex> {
    asset_service::rename_asset(project_root, relative_path, new_name).map_err(command_error)
}

#[tauri::command]
pub fn move_asset(
    project_root: String,
    relative_path: String,
    destination_relative: String,
) -> CommandResult<AssetIndex> {
    asset_service::move_asset(project_root, relative_path, destination_relative).map_err(command_error)
}

#[tauri::command]
pub fn duplicate_asset(project_root: String, relative_path: String) -> CommandResult<AssetIndex> {
    asset_service::duplicate_asset(project_root, relative_path).map_err(command_error)
}

