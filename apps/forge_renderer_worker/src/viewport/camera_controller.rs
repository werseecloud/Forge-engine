use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CameraControlMode {
    Orbit,
    Fly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraController {
    pub mode: CameraControlMode,
    pub orbit_distance: f32,
    pub movement_speed: f32,
}

impl Default for CameraController {
    fn default() -> Self {
        Self {
            mode: CameraControlMode::Orbit,
            orbit_distance: 6.0,
            movement_speed: 5.0,
        }
    }
}
