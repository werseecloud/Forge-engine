use glam::{Vec2, Vec3};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vertex {
    pub position: Vec3,
    pub normal: Vec3,
    pub uv: Vec2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mesh {
    pub id: String,
    pub vertices: Vec<Vertex>,
    pub indices: Vec<u32>,
}

impl Mesh {
    pub fn fallback_triangle() -> Self {
        Self {
            id: "fallback_triangle".to_string(),
            vertices: vec![
                Vertex { position: Vec3::new(0.0, 0.6, 0.0), normal: Vec3::Z, uv: Vec2::new(0.5, 0.0) },
                Vertex { position: Vec3::new(-0.6, -0.6, 0.0), normal: Vec3::Z, uv: Vec2::new(0.0, 1.0) },
                Vertex { position: Vec3::new(0.6, -0.6, 0.0), normal: Vec3::Z, uv: Vec2::new(1.0, 1.0) },
            ],
            indices: vec![0, 1, 2],
        }
    }
}
