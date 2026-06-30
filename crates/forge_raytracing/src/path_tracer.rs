use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathTracingSettings {
    pub samples_per_pixel: u32,
    pub max_bounces: u32,
    pub denoiser_enabled: bool,
    pub resolution_scale: f32,
    pub firefly_clamp: f32,
    pub environment_intensity: f32,
}

impl Default for PathTracingSettings {
    fn default() -> Self {
        Self {
            samples_per_pixel: 64,
            max_bounces: 6,
            denoiser_enabled: false,
            resolution_scale: 0.5,
            firefly_clamp: 10.0,
            environment_intensity: 1.0,
        }
    }
}
