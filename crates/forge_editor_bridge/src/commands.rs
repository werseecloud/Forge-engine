use forge_raytracing::PathTracingSettings;
use forge_renderer::{debug_views::DebugView, GraphicsSettings, QualityPreset, RendererPath};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EditorRendererCommand {
    SetRendererMode { mode: RendererPath },
    SetQualityPreset { preset: QualityPreset },
    SetRayTracingOption { option: String, enabled: bool },
    SetPathTracingSettings { settings: PathTracingSettings },
    SetPostProcessOption { option: String, value: Value },
    SetDebugView { view: DebugView },
    LoadScene { scene_path: String },
    LoadAsset { asset_path: String },
    ReloadShaders,
    CaptureFrame { output_path: String },
    GetGpuStats,
    GetBackendCapabilities,
    ApplyGraphicsSettings { settings: GraphicsSettings },
}
