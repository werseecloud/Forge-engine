#[derive(Debug, Clone)]
pub struct SwapchainConfig {
    pub width: u32,
    pub height: u32,
    pub present_mode: wgpu::PresentMode,
}
