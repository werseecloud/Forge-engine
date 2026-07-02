use serde::{Deserialize, Serialize};

use super::pin::BlueprintDataType;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintEdge {
    pub id: String,
    pub from_node_id: String,
    pub from_pin_id: String,
    pub to_node_id: String,
    pub to_pin_id: String,
    pub edge_type: String,
    pub data_type: BlueprintDataType,
    pub is_valid: bool,
}
