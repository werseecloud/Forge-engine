#[derive(Debug, Clone)]
pub struct ViewportOverlay {
    pub render_mode: String,
    pub fps: f64,
    pub camera_mode: String,
    pub selected_entity_name: Option<String>,
}
