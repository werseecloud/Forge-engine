use crate::config::RendererWorkerConfig;
use crate::wgpu_backend::context::WgpuContext;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckReport {
    pub status: String,
    pub component: String,
    pub version: String,
    pub gpu_available: bool,
    pub adapter_name: Option<String>,
    pub backend: Option<String>,
    pub vendor: Option<u32>,
    pub device: Option<u32>,
    pub driver: Option<String>,
    pub shader_library_ok: bool,
    pub ray_tracing_supported: bool,
    pub error: Option<String>,
}

pub async fn run_health_check() -> HealthCheckReport {
    match WgpuContext::initialize().await {
        Ok(context) => HealthCheckReport {
            status: "ok".to_string(),
            component: "forge_renderer_worker".to_string(),
            version: RendererWorkerConfig::VERSION.to_string(),
            gpu_available: true,
            adapter_name: Some(context.gpu_info.name),
            backend: Some(context.gpu_info.backend),
            vendor: Some(context.gpu_info.vendor),
            device: Some(context.gpu_info.device),
            driver: context.gpu_info.driver,
            shader_library_ok: crate::shaders::library::ShaderLibrary::default()
                .scan_default_library()
                .is_ok(),
            ray_tracing_supported: context.gpu_info.ray_tracing_supported,
            error: None,
        },
        Err(error) => HealthCheckReport {
            status: "error".to_string(),
            component: "forge_renderer_worker".to_string(),
            version: RendererWorkerConfig::VERSION.to_string(),
            gpu_available: false,
            adapter_name: None,
            backend: None,
            vendor: None,
            device: None,
            driver: None,
            shader_library_ok: false,
            ray_tracing_supported: false,
            error: Some(error.to_string()),
        },
    }
}
