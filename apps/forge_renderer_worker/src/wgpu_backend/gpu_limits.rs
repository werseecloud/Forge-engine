use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableGpuLimits {
    pub max_texture_dimension_2d: u32,
    pub max_bind_groups: u32,
    pub max_vertex_buffers: u32,
}

impl From<wgpu::Limits> for SerializableGpuLimits {
    fn from(value: wgpu::Limits) -> Self {
        Self {
            max_texture_dimension_2d: value.max_texture_dimension_2d,
            max_bind_groups: value.max_bind_groups,
            max_vertex_buffers: value.max_vertex_buffers,
        }
    }
}
