use crate::error::GpuInitError;

pub async fn request_high_performance_adapter(instance: &wgpu::Instance) -> Result<wgpu::Adapter, GpuInitError> {
    instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: false,
        })
        .await
        .ok_or(GpuInitError::NoAdapter)
}
