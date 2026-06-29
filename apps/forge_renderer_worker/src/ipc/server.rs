use crate::config::RendererWorkerConfig;
use crate::error::{IpcError, RendererError};
use crate::ipc::protocol::{RendererCommand, RendererEvent};
use crate::renderer::renderer_app::RendererApp;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};

pub struct RendererIpcServer {
    port: u16,
    renderer: RendererApp,
}

impl RendererIpcServer {
    pub fn new(port: u16, renderer: RendererApp) -> Self {
        Self { port, renderer }
    }

    pub async fn run(mut self) -> Result<(), RendererError> {
        let listener = TcpListener::bind(("127.0.0.1", self.port))
            .await
            .map_err(|error| IpcError::Transport(error.to_string()))?;
        let (stream, _) = listener
            .accept()
            .await
            .map_err(|error| IpcError::Transport(error.to_string()))?;
        self.handle_stream(stream).await
    }

    async fn handle_stream(&mut self, stream: TcpStream) -> Result<(), RendererError> {
        let (reader, mut writer) = stream.into_split();
        let mut lines = BufReader::new(reader).lines();
        write_event(
            &mut writer,
            &RendererEvent::RendererReady {
                version: RendererWorkerConfig::VERSION.to_string(),
            },
        )
        .await?;

        while let Some(line) = lines
            .next_line()
            .await
            .map_err(|error| IpcError::Transport(error.to_string()))?
        {
            let command: RendererCommand = serde_json::from_str(&line)
                .map_err(|error| IpcError::InvalidMessage(error.to_string()))?;
            let event = match command {
                RendererCommand::Ping => RendererEvent::Pong,
                RendererCommand::CreateViewport { width, height } => {
                    self.renderer.resize(width, height)?;
                    RendererEvent::ViewportCreated { width, height }
                }
                RendererCommand::ReloadShaders => {
                    self.renderer.reload_shaders()?;
                    RendererEvent::ShaderReloaded
                }
                RendererCommand::RequestRenderStats => RendererEvent::RenderStats {
                    stats: self.renderer.stats(),
                },
                RendererCommand::ResizeViewport { width, height } => {
                    self.renderer.resize(width, height)?;
                    RendererEvent::ViewportResized { width, height }
                }
                RendererCommand::LoadScene { scene_path } => RendererEvent::SceneLoaded { scene_path },
                RendererCommand::UnloadScene => RendererEvent::SceneUnloaded,
                RendererCommand::UpdateSceneSnapshot { version: _ } => RendererEvent::FrameStatsUpdated {
                    stats: self.renderer.stats(),
                },
                RendererCommand::SelectEntity { entity_id: _ } => RendererEvent::FrameStatsUpdated {
                    stats: self.renderer.stats(),
                },
                RendererCommand::FocusEntity { entity_id: _ } => RendererEvent::FrameStatsUpdated {
                    stats: self.renderer.stats(),
                },
                RendererCommand::SetCameraTransform { position: _, rotation: _ } => RendererEvent::FrameStatsUpdated {
                    stats: self.renderer.stats(),
                },
                RendererCommand::SetRenderMode { mode: _ } => RendererEvent::FrameStatsUpdated {
                    stats: self.renderer.stats(),
                },
                RendererCommand::CaptureScreenshot { path } => RendererEvent::Error {
                    message: format!("screenshot capture is unsupported until a surface-backed viewport is active: {path}"),
                },
                RendererCommand::RenderFrame => RendererEvent::FrameRendered {
                    stats: self.renderer.render_single_headless_frame()?,
                },
                RendererCommand::Shutdown => {
                    self.renderer.shutdown()?;
                    write_event(&mut writer, &RendererEvent::ShutdownAck).await?;
                    break;
                }
            };
            write_event(&mut writer, &event).await?;
        }
        Ok(())
    }
}

async fn write_event(
    writer: &mut tokio::net::tcp::OwnedWriteHalf,
    event: &RendererEvent,
) -> Result<(), RendererError> {
    let payload = serde_json::to_string(event).map_err(|error| IpcError::Transport(error.to_string()))?;
    writer
        .write_all(payload.as_bytes())
        .await
        .map_err(|error| IpcError::Transport(error.to_string()))?;
    writer
        .write_all(b"\n")
        .await
        .map_err(|error| IpcError::Transport(error.to_string()))?;
    writer
        .flush()
        .await
        .map_err(|error| IpcError::Transport(error.to_string()))?;
    Ok(())
}
