use glam::Vec4;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterialHandle(pub Uuid);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PbrMaterial {
    pub name: String,
    pub base_color: Vec4,
    pub metallic: f32,
    pub roughness: f32,
    pub emissive: Vec4,
    pub alpha_cutoff: Option<f32>,
}

impl Default for PbrMaterial {
    fn default() -> Self {
        Self {
            name: "Default PBR".to_string(),
            base_color: Vec4::ONE,
            metallic: 0.0,
            roughness: 0.55,
            emissive: Vec4::ZERO,
            alpha_cutoff: None,
        }
    }
}
