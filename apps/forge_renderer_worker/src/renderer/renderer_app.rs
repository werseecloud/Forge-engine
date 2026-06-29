use crate::config::RendererWorkerConfig;
use crate::error::RendererError;
use crate::renderer::backend::{FrameContext, RendererBackend};
use crate::renderer::stats::RenderStats;
use crate::wgpu_backend::renderer_backend::WgpuRendererBackend;

pub struct RendererApp {
    backend: Box<dyn RendererBackend>,
    frame_index: u64,
    pub config: RendererWorkerConfig,
}

impl RendererApp {
    pub async fn initialize(config: RendererWorkerConfig) -> Result<Self, RendererError> {
        let backend = WgpuRendererBackend::initialize().await?;
        Ok(Self {
            backend: Box::new(backend),
            frame_index: 0,
            config,
        })
    }

    pub fn render_single_headless_frame(&mut self) -> Result<RenderStats, RendererError> {
        self.frame_index += 1;
        self.backend.render_frame(&FrameContext {
            frame_index: self.frame_index,
            delta_seconds: 0.0,
        })
    }

    pub fn reload_shaders(&mut self) -> Result<(), RendererError> {
        self.backend.reload_shaders()
    }

    pub fn stats(&self) -> RenderStats {
        self.backend.get_stats()
    }

    pub fn resize(&mut self, width: u32, height: u32) -> Result<(), RendererError> {
        self.backend.resize(width, height)
    }

    pub fn shutdown(&mut self) -> Result<(), RendererError> {
        self.backend.shutdown()
    }
}
