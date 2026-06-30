use crate::{BackendApi, BackendCapabilities, BackendPreference};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RhiError {
    #[error("wgpu support is not enabled for forge_rhi")]
    WgpuDisabled,
    #[error("no suitable GPU adapter was found")]
    NoAdapter,
    #[error("GPU device request failed: {0}")]
    RequestDevice(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RhiDeviceInfo {
    pub backend: BackendApi,
    pub capabilities: BackendCapabilities,
}

pub struct DeviceFactory;

impl DeviceFactory {
    pub fn detect_default_blocking() -> Result<RhiDeviceInfo, RhiError> {
        #[cfg(feature = "webgpu")]
        {
            pollster::block_on(Self::detect_default_async(
                BackendPreference::HighPerformance,
            ))
        }
        #[cfg(not(feature = "webgpu"))]
        {
            Err(RhiError::WgpuDisabled)
        }
    }

    #[cfg(feature = "webgpu")]
    pub async fn detect_default_async(
        preference: BackendPreference,
    ) -> Result<RhiDeviceInfo, RhiError> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: enabled_backends(),
            flags: wgpu::InstanceFlags::default(),
            dx12_shader_compiler: Default::default(),
            gles_minor_version: wgpu::Gles3MinorVersion::Automatic,
        });
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: match preference {
                    BackendPreference::LowPower | BackendPreference::BrowserSafe => {
                        wgpu::PowerPreference::LowPower
                    }
                    BackendPreference::HighPerformance => wgpu::PowerPreference::HighPerformance,
                },
                compatible_surface: None,
                force_fallback_adapter: false,
            })
            .await
            .ok_or(RhiError::NoAdapter)?;
        let info = adapter.get_info();
        let features = adapter.features();
        let limits = adapter.limits();
        let backend = BackendApi::from(info.backend);

        Ok(RhiDeviceInfo {
            backend,
            capabilities: BackendCapabilities {
                supports_compute: true,
                supports_timestamp_queries: features.contains(wgpu::Features::TIMESTAMP_QUERY),
                supports_pipeline_cache: false,
                supports_bindless_resources: features.contains(wgpu::Features::TEXTURE_BINDING_ARRAY)
                    || features.contains(wgpu::Features::SAMPLED_TEXTURE_AND_STORAGE_BUFFER_ARRAY_NON_UNIFORM_INDEXING),
                supports_mesh_shaders: false,
                supports_ray_tracing: false,
                supports_ray_queries: false,
                supports_ray_tracing_pipeline: false,
                supports_variable_rate_shading: false,
                supports_sampler_feedback: false,
                supports_texture_compression_bc: features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC),
                supports_texture_compression_astc: features.contains(wgpu::Features::TEXTURE_COMPRESSION_ASTC),
                supports_texture_compression_etc2: features.contains(wgpu::Features::TEXTURE_COMPRESSION_ETC2),
                supports_hdr_surface: true,
                supports_depth_clip_control: features.contains(wgpu::Features::DEPTH_CLIP_CONTROL),
                max_texture_size: limits.max_texture_dimension_2d,
                max_bind_groups: limits.max_bind_groups,
                max_storage_buffers: limits.max_storage_buffers_per_shader_stage,
                max_sampled_textures: limits.max_sampled_textures_per_shader_stage,
                max_lights_per_cluster: 128,
                backend_name: format!("{:?}", info.backend),
                adapter_name: info.name,
                vendor_id: Some(info.vendor),
                device_id: Some(info.device),
            },
        })
    }
}

#[cfg(feature = "webgpu")]
fn enabled_backends() -> wgpu::Backends {
    #[allow(unused_mut)]
    let mut backends = wgpu::Backends::empty();
    #[cfg(feature = "dx12")]
    {
        backends |= wgpu::Backends::DX12;
    }
    #[cfg(feature = "vulkan")]
    {
        backends |= wgpu::Backends::VULKAN;
    }
    #[cfg(feature = "metal")]
    {
        backends |= wgpu::Backends::METAL;
    }
    #[cfg(feature = "opengl_fallback")]
    {
        backends |= wgpu::Backends::GL;
    }
    if backends.is_empty() {
        wgpu::Backends::all()
    } else {
        backends
    }
}
