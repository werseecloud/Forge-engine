use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SsaoSettings {
    pub enabled: bool,
    pub radius: f32,
    pub intensity: f32,
    pub sample_count: u32,
    pub half_resolution: bool,
}

impl Default for SsaoSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            radius: 0.75,
            intensity: 1.4,
            sample_count: 16,
            half_resolution: true,
        }
    }
}
