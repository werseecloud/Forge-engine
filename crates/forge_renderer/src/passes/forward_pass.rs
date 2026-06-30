use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForwardPass {
    pub hdr_target: String,
    pub depth_target: String,
    pub clustered_lighting: bool,
    pub max_lights: u32,
}
