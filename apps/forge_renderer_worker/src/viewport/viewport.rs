use crate::viewport::camera::Camera;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub id: String,
    pub width: u32,
    pub height: u32,
    pub active_camera: Camera,
    pub render_mode: String,
    pub show_grid: bool,
    pub show_gizmos: bool,
    pub selected_entity: Option<String>,
}
