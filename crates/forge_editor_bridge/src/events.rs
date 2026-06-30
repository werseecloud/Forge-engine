use forge_renderer::{GpuStats, GraphicsSettings};
use forge_rhi::BackendCapabilities;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EditorRendererEvent {
    BackendCapabilitiesChanged {
        capabilities: BackendCapabilities,
    },
    GpuStatsUpdated {
        stats: GpuStats,
    },
    ShaderCompilationEvent {
        shader: String,
        status: String,
        message: Option<String>,
    },
    AssetLoaded {
        asset_path: String,
    },
    RenderError {
        message: String,
        recoverable: bool,
    },
    FrameCaptureReady {
        output_path: String,
    },
    GraphicsSettingsApplied {
        settings: GraphicsSettings,
    },
}
