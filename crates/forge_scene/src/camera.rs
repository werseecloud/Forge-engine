use glam::{Mat4, Vec3};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Camera {
    pub name: String,
    pub position: Vec3,
    pub target: Vec3,
    pub vertical_fov_degrees: f32,
    pub near: f32,
    pub far: f32,
}

impl Default for Camera {
    fn default() -> Self {
        Self {
            name: "Main Camera".to_string(),
            position: Vec3::new(0.0, 3.0, 8.0),
            target: Vec3::ZERO,
            vertical_fov_degrees: 60.0,
            near: 0.05,
            far: 10_000.0,
        }
    }
}

impl Camera {
    pub fn view_matrix(&self) -> Mat4 {
        Mat4::look_at_rh(self.position, self.target, Vec3::Y)
    }

    pub fn projection_matrix(&self, aspect_ratio: f32) -> Mat4 {
        Mat4::perspective_rh(
            self.vertical_fov_degrees.to_radians(),
            aspect_ratio,
            self.near,
            self.far,
        )
    }
}
