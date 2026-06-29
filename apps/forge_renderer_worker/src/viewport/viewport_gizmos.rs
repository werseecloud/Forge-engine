#[derive(Debug, Clone, Default)]
pub struct ViewportGizmos {
    pub transform_gizmo_visible: bool,
    pub selected_entity: Option<String>,
}
