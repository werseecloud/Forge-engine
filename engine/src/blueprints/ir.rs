use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintIrNode {
    pub id: String,
    pub type_id: String,
    pub properties: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintIr {
    pub graph_id: String,
    pub entry_nodes: Vec<String>,
    pub nodes: Vec<BlueprintIrNode>,
    pub execution_edges: Vec<(String, String)>,
}
