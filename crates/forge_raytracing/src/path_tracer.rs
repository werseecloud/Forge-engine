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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathTracingAccumulation {
    pub frame_index: u64,
    pub accumulated_samples: u32,
    pub reset_requested: bool,
}

impl PathTracingAccumulation {
    pub fn reset(&mut self) {
        self.frame_index = 0;
        self.accumulated_samples = 0;
        self.reset_requested = true;
    }

    pub fn begin_frame(&mut self, samples_this_frame: u32) {
        if self.reset_requested {
            self.reset_requested = false;
        }
        self.frame_index = self.frame_index.saturating_add(1);
        self.accumulated_samples = self.accumulated_samples.saturating_add(samples_this_frame);
    }
}

impl Default for PathTracingAccumulation {
    fn default() -> Self {
        Self {
            frame_index: 0,
            accumulated_samples: 0,
            reset_requested: false,
        }
    }
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

impl PathTracingSettings {
    pub fn sanitized(mut self) -> Self {
        self.samples_per_pixel = self.samples_per_pixel.clamp(1, 4096);
        self.max_bounces = self.max_bounces.clamp(1, 32);
        self.resolution_scale = self.resolution_scale.clamp(0.1, 1.0);
        self.firefly_clamp = self.firefly_clamp.clamp(0.0, 1000.0);
        self.environment_intensity = self.environment_intensity.clamp(0.0, 100.0);
        self
    }

    pub fn samples_for_next_frame(&self, accumulated_samples: u32) -> u32 {
        self.samples_per_pixel
            .saturating_sub(accumulated_samples)
            .min(8)
            .max(1)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_are_clamped_to_runtime_limits() {
        let settings = PathTracingSettings {
            samples_per_pixel: 0,
            max_bounces: 99,
            denoiser_enabled: true,
            resolution_scale: 4.0,
            firefly_clamp: 10_000.0,
            environment_intensity: 500.0,
        }
        .sanitized();

        assert_eq!(settings.samples_per_pixel, 1);
        assert_eq!(settings.max_bounces, 32);
        assert_eq!(settings.resolution_scale, 1.0);
        assert_eq!(settings.firefly_clamp, 1000.0);
        assert_eq!(settings.environment_intensity, 100.0);
    }

    #[test]
    fn accumulation_reset_and_begin_frame_are_consistent() {
        let mut accumulation = PathTracingAccumulation::default();
        accumulation.begin_frame(4);
        assert_eq!(accumulation.frame_index, 1);
        assert_eq!(accumulation.accumulated_samples, 4);
        accumulation.reset();
        assert!(accumulation.reset_requested);
        accumulation.begin_frame(2);
        assert!(!accumulation.reset_requested);
        assert_eq!(accumulation.frame_index, 1);
        assert_eq!(accumulation.accumulated_samples, 2);
    }
}
