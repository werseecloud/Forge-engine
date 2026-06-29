use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugOverlayState {
    pub show_grid: bool,
    pub show_bounds: bool,
    pub show_frame_stats: bool,
}

impl Default for DebugOverlayState {
    fn default() -> Self {
        Self {
            show_grid: true,
            show_bounds: false,
            show_frame_stats: true,
        }
    }
}
