use glam::{Mat4, Vec3};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneObject {
    pub id: String,
    pub mesh_id: String,
    pub material_id: String,
    pub transform: Mat4,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SceneSnapshot {
    pub version: u64,
    pub objects: Vec<SceneObject>,
}

impl SceneSnapshot {
    pub fn default_probe_scene() -> Self {
        Self {
            version: 1,
            objects: vec![SceneObject {
                id: "probe_triangle".to_string(),
                mesh_id: "fallback_triangle".to_string(),
                material_id: "mat_grid_default".to_string(),
                transform: Mat4::from_translation(Vec3::ZERO),
            }],
        }
    }
}
