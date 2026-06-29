use crate::error::GpuInitError;

pub async fn request_device(adapter: &wgpu::Adapter) -> Result<(wgpu::Device, wgpu::Queue), GpuInitError> {
    adapter
        .request_device(
            &wgpu::DeviceDescriptor {
                label: Some("Forge Renderer Worker Device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_defaults(),
            },
            None,
        )
        .await
        .map_err(|error| GpuInitError::RequestDevice(error.to_string()))
}
