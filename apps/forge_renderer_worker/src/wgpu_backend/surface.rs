#[derive(Debug, Clone, Copy)]
pub struct SurfaceState {
    pub width: u32,
    pub height: u32,
    pub format: Option<wgpu::TextureFormat>,
}
