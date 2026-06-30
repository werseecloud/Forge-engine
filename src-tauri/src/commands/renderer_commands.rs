use crate::services::renderer_service;
use crate::utils::errors::{command_error, CommandResult};
use forge_renderer::{GpuStats, GraphicsSettings, RendererFeatureMatrix};
use forge_rhi::BackendCapabilities;

#[tauri::command]
pub fn get_backend_capabilities() -> CommandResult<BackendCapabilities> {
    renderer_service::get_backend_capabilities().map_err(command_error)
}

#[tauri::command]
pub fn get_renderer_settings() -> CommandResult<GraphicsSettings> {
    renderer_service::get_renderer_settings().map_err(command_error)
}

#[tauri::command]
pub fn update_renderer_settings(settings: GraphicsSettings) -> CommandResult<GraphicsSettings> {
    renderer_service::update_renderer_settings(settings).map_err(command_error)
}

#[tauri::command]
pub fn get_gpu_stats() -> CommandResult<GpuStats> {
    renderer_service::get_gpu_stats().map_err(command_error)
}

#[tauri::command]
pub fn get_renderer_feature_matrix() -> CommandResult<RendererFeatureMatrix> {
    renderer_service::get_renderer_feature_matrix().map_err(command_error)
}

#[tauri::command]
pub fn reset_path_tracing_accumulation() -> CommandResult<String> {
    renderer_service::reset_path_tracing_accumulation().map_err(command_error)
}
