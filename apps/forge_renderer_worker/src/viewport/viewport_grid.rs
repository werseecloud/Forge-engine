use glam::Vec3;

#[derive(Debug, Clone)]
pub struct ViewportGrid {
    pub enabled: bool,
    pub spacing: f32,
    pub color: Vec3,
    pub x_axis_color: Vec3,
    pub z_axis_color: Vec3,
}
