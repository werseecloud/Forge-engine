use anyhow::Result;
use forge_renderer::{GpuStats, GraphicsSettings, RendererFeatureMatrix, RendererPath};
use forge_rhi::BackendCapabilities;

use crate::services::{log_service, settings_service};

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
    if !capabilities.supports_ray_tracing {
        settings.ray_traced_shadows = false;
        settings.ray_traced_reflections = false;
        settings.ray_traced_ao = false;
        settings.ray_traced_gi = false;
        if matches!(settings.renderer_path, RendererPath::HybridRayTracing) {
            settings.renderer_path = RendererPath::Deferred;
        }
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
    Ok(GpuStats {
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
    log_service::append_output_log("Path tracing accumulation reset requested").ok();
    Ok("Path tracing accumulation reset requested".to_string())
}
