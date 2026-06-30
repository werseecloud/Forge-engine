use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SsrSettings {
    pub enabled: bool,
    pub max_steps: u32,
    pub thickness: f32,
    pub roughness_fade_start: f32,
    pub roughness_fade_end: f32,
}

impl Default for SsrSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            max_steps: 64,
            thickness: 0.15,
            roughness_fade_start: 0.35,
            roughness_fade_end: 0.85,
        }
    }
}
