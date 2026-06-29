use crate::error::RendererError;
use crate::renderer::backend::{FrameContext, RendererBackend};
use crate::renderer::stats::RenderStats;
use crate::wgpu_backend::context::{GpuInfo, WgpuContext};
use std::time::Instant;

pub struct WgpuRendererBackend {
    context: WgpuContext,
    stats: RenderStats,
    last_frame: Instant,
}

impl WgpuRendererBackend {
    pub async fn initialize() -> Result<Self, RendererError> {
        let context = WgpuContext::initialize().await?;
        let adapter_name = context.gpu_info.name.clone();
        Ok(Self {
            context,
            stats: RenderStats {
                adapter_name: Some(adapter_name),
                ..RenderStats::default()
            },
            last_frame: Instant::now(),
        })
    }

    pub fn gpu_info(&self) -> &GpuInfo {
        &self.context.gpu_info
    }
}

impl RendererBackend for WgpuRendererBackend {
    fn resize(&mut self, width: u32, height: u32) -> Result<(), RendererError> {
        self.stats.viewport_width = width;
        self.stats.viewport_height = height;
        Ok(())
    }

    fn render_frame(&mut self, frame: &FrameContext) -> Result<RenderStats, RendererError> {
        let mut encoder = self
            .context
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("Forge Renderer Worker Headless Encoder"),
            });
        let _ = &mut encoder;
        self.context.queue.submit(Some(encoder.finish()));

        let elapsed = self.last_frame.elapsed();
        self.last_frame = Instant::now();
        self.stats.frame_index = frame.frame_index;
        self.stats.frame_time_ms = elapsed.as_secs_f64() * 1000.0;
        self.stats.cpu_time_ms = self.stats.frame_time_ms;
        self.stats.fps = if elapsed.as_secs_f64() > 0.0 {
            1.0 / elapsed.as_secs_f64()
        } else {
            0.0
        };
        Ok(self.stats.clone())
    }

    fn reload_shaders(&mut self) -> Result<(), RendererError> {
        Ok(())
    }

    fn get_stats(&self) -> RenderStats {
        self.stats.clone()
    }

    fn shutdown(&mut self) -> Result<(), RendererError> {
        Ok(())
    }
}
