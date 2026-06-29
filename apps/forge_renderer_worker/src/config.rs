use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RendererWorkerConfig {
    pub version: String,
    pub project_path: Option<PathBuf>,
    pub ipc_port: Option<u16>,
    pub log_dir: Option<PathBuf>,
    pub backend: String,
    pub vsync: bool,
    pub target_fps: u32,
    pub shader_hot_reload: bool,
    pub gpu_preference: String,
    pub debug_mode: bool,
}

impl RendererWorkerConfig {
    pub const VERSION: &'static str = "1.0.0";
}

impl Default for RendererWorkerConfig {
    fn default() -> Self {
        Self {
            version: Self::VERSION.to_string(),
            project_path: None,
            ipc_port: None,
            log_dir: None,
            backend: "wgpu".to_string(),
            vsync: true,
            target_fps: 60,
            shader_hot_reload: true,
            gpu_preference: "high-performance".to_string(),
            debug_mode: false,
        }
    }
}

