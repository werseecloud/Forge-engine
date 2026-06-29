use glam::Vec4;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Material {
    pub id: String,
    pub display_name: String,
    pub base_color: Vec4,
    pub metallic: f32,
    pub roughness: f32,
}

impl Material {
    pub fn default_grid() -> Self {
        Self {
            id: "mat_grid_default".to_string(),
            display_name: "Default Grid".to_string(),
            base_color: Vec4::new(0.05, 0.12, 0.22, 1.0),
            metallic: 0.0,
            roughness: 0.55,
        }
    }
}
