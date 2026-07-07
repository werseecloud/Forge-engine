use anyhow::Result;
use forge_raytracing::PathTracingAccumulation;
use forge_renderer::{GpuStats, GraphicsSettings, RendererFeatureMatrix};
use forge_rhi::BackendCapabilities;
use std::sync::{Mutex, OnceLock};

use crate::services::{log_service, settings_service};

static PATH_TRACING_ACCUMULATION: OnceLock<Mutex<PathTracingAccumulation>> = OnceLock::new();

pub fn get_backend_capabilities() -> Result<BackendCapabilities> {
    let info = forge_rhi::DeviceFactory::detect_default_blocking()?;
    Ok(info.capabilities)
}

pub fn get_renderer_settings() -> Result<GraphicsSettings> {
    Ok(settings_service::load_settings()?.graphics_settings)
}

pub fn update_renderer_settings(mut settings: GraphicsSettings) -> Result<GraphicsSettings> {
    let capabilities =
        get_backend_capabilities().unwrap_or_else(|_| BackendCapabilities::conservative_software());
    let requested_path = settings.renderer_path;
    settings = settings.sanitized_for_capabilities(&capabilities);
    if requested_path != settings.renderer_path {
        log_service::append_output_log(&format!(
            "Renderer path {:?} is unsupported on this backend; using {:?}. Reason: {}",
            requested_path, settings.renderer_path, capabilities.ray_tracing_support.reason
        ))
        .ok();
    }

    let mut app_settings = settings_service::load_settings()?;
    app_settings.graphics_settings = settings.clone();
    settings_service::save_settings(&app_settings)?;
    log_service::append_output_log(&format!(
        "Renderer settings updated: {:?}",
        settings.renderer_path
    ))
    .ok();
    Ok(settings)
}

pub fn get_gpu_stats() -> Result<GpuStats> {
    let capabilities =
        get_backend_capabilities().unwrap_or_else(|_| BackendCapabilities::conservative_software());
    let accumulation = PATH_TRACING_ACCUMULATION
        .get_or_init(|| Mutex::new(PathTracingAccumulation::default()))
        .lock()
        .ok()
        .map(|state| state.clone())
        .unwrap_or_default();
    Ok(GpuStats {
        frame_index: accumulation.frame_index,
        backend_name: capabilities.backend_name,
        adapter_name: Some(capabilities.adapter_name),
        ..GpuStats::default()
    })
}

pub fn get_renderer_feature_matrix() -> Result<RendererFeatureMatrix> {
    let capabilities =
        get_backend_capabilities().unwrap_or_else(|_| BackendCapabilities::conservative_software());
    Ok(RendererFeatureMatrix::from_capabilities(&capabilities))
}

pub fn reset_path_tracing_accumulation() -> Result<String> {
    let accumulation =
        PATH_TRACING_ACCUMULATION.get_or_init(|| Mutex::new(PathTracingAccumulation::default()));
    if let Ok(mut state) = accumulation.lock() {
        state.reset();
    }
    log_service::append_output_log("Path tracing accumulation reset").ok();
    Ok("Path tracing accumulation reset".to_string())
}
