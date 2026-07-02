use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use super::pin::BlueprintPin;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintNode {
    pub id: String,
    pub type_id: String,
    pub title: String,
    pub category: String,
    pub position: [f32; 2],
    pub inputs: Vec<BlueprintPin>,
    pub outputs: Vec<BlueprintPin>,
    pub properties: HashMap<String, Value>,
    pub execution_mode: String,
    pub is_pure: bool,
    pub is_latent: bool,
    pub is_disabled: bool,
    pub breakpoint_enabled: bool,
    pub comment: String,
}
