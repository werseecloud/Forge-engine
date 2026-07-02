use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use super::{edge::BlueprintEdge, node::BlueprintNode, pin::BlueprintDataType};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintVariable {
    pub id: String,
    pub name: String,
    pub data_type: BlueprintDataType,
    pub default_value: Value,
    pub scope: String,
    pub exposed: bool,
    pub replicated: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintGraph {
    pub id: String,
    pub name: String,
    pub graph_type: String,
    pub nodes: Vec<BlueprintNode>,
    pub edges: Vec<BlueprintEdge>,
    pub variables: Vec<BlueprintVariable>,
    pub functions: Vec<String>,
    pub macros: Vec<String>,
    pub metadata: HashMap<String, Value>,
    pub version: u32,
    pub compile_status: String,
    pub created_at: String,
    pub updated_at: String,
}
