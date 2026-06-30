use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BloomPass {
    pub threshold: f32,
    pub intensity: f32,
    pub mip_count: u32,
}
