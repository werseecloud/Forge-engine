use crate::renderer::stats::RenderStats;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RendererCommand {
    Ping,
    Shutdown,
    CreateViewport { width: u32, height: u32 },
    ReloadShaders,
    RequestRenderStats,
    ResizeViewport { width: u32, height: u32 },
    LoadScene { scene_path: String },
    UnloadScene,
    UpdateSceneSnapshot { version: u64 },
    SelectEntity { entity_id: Option<String> },
    FocusEntity { entity_id: String },
    SetCameraTransform { position: [f32; 3], rotation: [f32; 4] },
    SetRenderMode { mode: String },
    CaptureScreenshot { path: String },
    RenderFrame,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RendererEvent {
    RendererReady { version: String },
    Pong,
    ShaderReloaded,
    ViewportCreated { width: u32, height: u32 },
    ViewportResized { width: u32, height: u32 },
    SceneLoaded { scene_path: String },
    SceneUnloaded,
    FrameRendered { stats: RenderStats },
    FrameStatsUpdated { stats: RenderStats },
    RenderStats { stats: RenderStats },
    ShaderCompileError { path: String, error: String },
    GpuDeviceLost { reason: String },
    ScreenshotSaved { path: String },
    ShutdownAck,
    Error { message: String },
}
