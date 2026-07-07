use forge_raytracing::RayTracingSupport;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendCapabilities {
    pub supports_compute: bool,
    pub supports_timestamp_queries: bool,
    pub supports_pipeline_cache: bool,
    pub supports_bindless_resources: bool,
    pub supports_mesh_shaders: bool,
    pub supports_ray_tracing: bool,
    pub supports_ray_queries: bool,
    pub supports_ray_tracing_pipeline: bool,
    #[serde(default)]
    pub ray_tracing_support: RayTracingSupport,
    pub supports_variable_rate_shading: bool,
    pub supports_sampler_feedback: bool,
    pub supports_texture_compression_bc: bool,
    pub supports_texture_compression_astc: bool,
    pub supports_texture_compression_etc2: bool,
    pub supports_hdr_surface: bool,
    pub supports_depth_clip_control: bool,
    pub max_texture_size: u32,
    pub max_bind_groups: u32,
    pub max_storage_buffers: u32,
    pub max_sampled_textures: u32,
    pub max_lights_per_cluster: u32,
    pub backend_name: String,
    pub adapter_name: String,
    pub vendor_id: Option<u32>,
    pub device_id: Option<u32>,
}

impl BackendCapabilities {
    pub fn conservative_software() -> Self {
        Self {
            supports_compute: false,
            supports_timestamp_queries: false,
            supports_pipeline_cache: false,
            supports_bindless_resources: false,
            supports_mesh_shaders: false,
            supports_ray_tracing: false,
            supports_ray_queries: false,
            supports_ray_tracing_pipeline: false,
            ray_tracing_support: RayTracingSupport::unsupported(
                "No GPU adapter or RHI ray tracing backend is available.",
            ),
            supports_variable_rate_shading: false,
            supports_sampler_feedback: false,
            supports_texture_compression_bc: false,
            supports_texture_compression_astc: false,
            supports_texture_compression_etc2: false,
            supports_hdr_surface: false,
            supports_depth_clip_control: false,
            max_texture_size: 4096,
            max_bind_groups: 4,
            max_storage_buffers: 4,
            max_sampled_textures: 16,
            max_lights_per_cluster: 32,
            backend_name: "Unknown".to_string(),
            adapter_name: "No GPU adapter detected".to_string(),
            vendor_id: None,
            device_id: None,
        }
    }
}
