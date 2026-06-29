use crate::ipc::events::RendererHeartbeat;

pub fn healthy_heartbeat(frame_index: u64) -> RendererHeartbeat {
    RendererHeartbeat {
        status: "running".to_string(),
        frame_index,
        last_error: None,
    }
}
