use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RendererHeartbeat {
    pub status: String,
    pub frame_index: u64,
    pub last_error: Option<String>,
}
