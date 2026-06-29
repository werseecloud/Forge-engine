use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableGpuFeatures {
    pub timestamp_query: bool,
    pub texture_compression_bc: bool,
}

impl From<wgpu::Features> for SerializableGpuFeatures {
    fn from(value: wgpu::Features) -> Self {
        Self {
            timestamp_query: value.contains(wgpu::Features::TIMESTAMP_QUERY),
            texture_compression_bc: value.contains(wgpu::Features::TEXTURE_COMPRESSION_BC),
        }
    }
}
