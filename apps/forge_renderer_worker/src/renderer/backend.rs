use crate::error::RendererError;
use crate::renderer::stats::RenderStats;

#[derive(Debug, Clone)]
pub struct FrameContext {
    pub frame_index: u64,
    pub delta_seconds: f32,
}

pub trait RendererBackend: Send {
    fn resize(&mut self, width: u32, height: u32) -> Result<(), RendererError>;
    fn render_frame(&mut self, frame: &FrameContext) -> Result<RenderStats, RendererError>;
    fn reload_shaders(&mut self) -> Result<(), RendererError>;
    fn get_stats(&self) -> RenderStats;
    fn shutdown(&mut self) -> Result<(), RendererError>;
}
