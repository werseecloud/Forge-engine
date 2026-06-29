pub mod camera;
pub mod camera_controller;
pub mod viewport;
pub mod viewport_gizmos;
pub mod viewport_grid;
pub mod viewport_overlay;
pub mod viewport_target;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewportState {
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

impl Default for ViewportState {
    fn default() -> Self {
        Self {
            width: 1280,
            height: 720,
            scale_factor: 1.0,
        }
    }
}
