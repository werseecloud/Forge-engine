use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderStats {
    pub frame_index: u64,
    pub fps: f64,
    pub frame_time_ms: f64,
    pub draw_calls: u32,
    pub triangles: u64,
    pub cpu_time_ms: f64,
    pub gpu_time_ms: Option<f64>,
    pub visible_objects: u32,
    pub shader_reload_count: u32,
    pub backend_name: String,
    pub adapter_name: Option<String>,
    pub viewport_width: u32,
    pub viewport_height: u32,
}

impl Default for RenderStats {
    fn default() -> Self {
        Self {
            frame_index: 0,
            fps: 0.0,
            frame_time_ms: 0.0,
            draw_calls: 0,
            triangles: 0,
            cpu_time_ms: 0.0,
            gpu_time_ms: None,
            visible_objects: 0,
            shader_reload_count: 0,
            backend_name: "wgpu".to_string(),
            adapter_name: None,
            viewport_width: 1280,
            viewport_height: 720,
        }
    }
}
