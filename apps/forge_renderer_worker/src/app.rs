use crate::config::RendererWorkerConfig;
use crate::error::RendererError;
use crate::ipc::server::RendererIpcServer;
use crate::renderer::renderer_app::RendererApp;

pub struct RendererWorkerApp {
    config: RendererWorkerConfig,
}

impl RendererWorkerApp {
    pub fn new(config: RendererWorkerConfig) -> Self {
        Self { config }
    }

    pub fn run(config: RendererWorkerConfig) -> Result<(), RendererError> {
        let app = Self::new(config);
        pollster::block_on(app.run_async())
    }

    pub fn run_standalone(config: RendererWorkerConfig) -> Result<(), RendererError> {
        let mut renderer = pollster::block_on(RendererApp::initialize(config))?;
        renderer.render_single_headless_frame()?;
        tracing::info!("standalone renderer prepared a headless frame; windowed standalone viewport is not enabled in this build");
        Ok(())
    }

    async fn run_async(self) -> Result<(), RendererError> {
        let renderer = RendererApp::initialize(self.config.clone()).await?;
        if let Some(port) = self.config.ipc_port {
            let server = RendererIpcServer::new(port, renderer);
            server.run().await?;
        } else {
            tracing::info!("renderer worker initialized without IPC port; waiting is skipped for CLI safety");
        }
        Ok(())
    }
}
