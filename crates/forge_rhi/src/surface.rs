use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SurfaceConfig {
    pub width: u32,
    pub height: u32,
    pub hdr: bool,
    pub vsync: bool,
    pub present_mode: String,
}

impl Default for SurfaceConfig {
    fn default() -> Self {
        Self {
            width: 1280,
            height: 720,
            hdr: true,
            vsync: true,
            present_mode: "AutoVsync".to_string(),
        }
    }
}
