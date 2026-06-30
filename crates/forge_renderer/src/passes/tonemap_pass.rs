use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TonemapPass {
    pub input_hdr: String,
    pub output_ldr: String,
    pub exposure: f32,
    pub filmic: bool,
}
