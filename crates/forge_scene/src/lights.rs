use glam::Vec3;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectionalLight {
    pub name: String,
    pub direction: Vec3,
    pub color: Vec3,
    pub intensity_lux: f32,
    pub casts_shadows: bool,
}

impl Default for DirectionalLight {
    fn default() -> Self {
        Self {
            name: "Sun".to_string(),
            direction: Vec3::new(-0.4, -1.0, -0.2).normalize(),
            color: Vec3::ONE,
            intensity_lux: 65_000.0,
            casts_shadows: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PointLight {
    pub name: String,
    pub position: Vec3,
    pub color: Vec3,
    pub intensity_lumens: f32,
    pub radius: f32,
    pub casts_shadows: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkySettings {
    pub environment_intensity: f32,
    pub fog_density: f32,
    pub sky_color: Vec3,
}

impl Default for SkySettings {
    fn default() -> Self {
        Self {
            environment_intensity: 1.0,
            fog_density: 0.0,
            sky_color: Vec3::new(0.45, 0.62, 0.9),
        }
    }
}
