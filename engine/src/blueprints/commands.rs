use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlueprintCommandType {
    SpawnEntity,
    DestroyEntity,
    SetTransform,
    AddForce,
    PlaySound,
    LoadScene,
    SetVariable,
    SendNetworkEvent,
    UpdateUiWidget,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintCommand {
    pub command_type: BlueprintCommandType,
    pub target: Option<String>,
    pub payload: HashMap<String, Value>,
}
