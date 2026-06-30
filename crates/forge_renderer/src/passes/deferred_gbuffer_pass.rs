use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeferredGBufferLayout {
    pub albedo_format: String,
    pub normal_format: String,
    pub material_format: String,
    pub motion_vector_format: String,
    pub depth_format: String,
}

impl Default for DeferredGBufferLayout {
    fn default() -> Self {
        Self {
            albedo_format: "Rgba16Float".to_string(),
            normal_format: "Rgba16Float".to_string(),
            material_format: "Rgba8Unorm".to_string(),
            motion_vector_format: "Rg16Float".to_string(),
            depth_format: "Depth32Float".to_string(),
        }
    }
}
