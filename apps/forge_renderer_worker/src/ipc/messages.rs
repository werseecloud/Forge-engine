use crate::ipc::protocol::{RendererCommand, RendererEvent};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RendererMessage {
    pub id: Uuid,
    pub command: RendererCommand,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RendererResponse {
    pub id: Uuid,
    pub event: RendererEvent,
}
