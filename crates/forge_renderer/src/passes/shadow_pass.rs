use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShadowPass {
    pub atlas_size: u32,
    pub cascade_count: u32,
    pub supports_directional_shadow_map: bool,
}
