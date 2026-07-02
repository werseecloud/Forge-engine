use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintGraph {
    pub graph_id: String,
    pub name: String,
    pub graph_type: String,
    pub nodes: Vec<BlueprintNode>,
    pub edges: Vec<BlueprintEdge>,
    pub variables: Vec<BlueprintVariable>,
    pub exposed_inputs: Vec<BlueprintPin>,
    pub exposed_outputs: Vec<BlueprintPin>,
    pub metadata: HashMap<String, Value>,
    pub version: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub title: String,
    pub category: String,
    pub position: BlueprintPosition,
    pub inputs: Vec<BlueprintPin>,
    pub outputs: Vec<BlueprintPin>,
    pub properties: HashMap<String, Value>,
    pub execution_mode: String,
    pub breakpoint_enabled: bool,
    pub comment: String,
    pub disabled: bool,
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintPin {
    pub id: String,
    pub name: String,
    pub direction: String,
    pub pin_kind: String,
    pub data_type: String,
    pub required: bool,
    pub default_value: Option<Value>,
    pub multiple_connections_allowed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintEdge {
    pub id: String,
    pub from_node_id: String,
    pub from_pin_id: String,
    pub to_node_id: String,
    pub to_pin_id: String,
    pub edge_type: String,
    pub data_type: String,
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintVariable {
    pub id: String,
    pub name: String,
    pub data_type: String,
    pub default_value: Value,
    pub exposed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintGraphSummary {
    pub graph_id: String,
    pub name: String,
    pub graph_type: String,
    pub relative_path: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintDiagnostic {
    pub id: String,
    pub severity: String,
    pub message: String,
    pub node_id: Option<String>,
    pub edge_id: Option<String>,
    pub recovery: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintIrNode {
    pub id: String,
    pub node_type: String,
    pub title: String,
    pub properties: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintIrEdge {
    pub from_node_id: String,
    pub from_pin_id: String,
    pub to_node_id: String,
    pub to_pin_id: String,
    pub edge_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintIr {
    pub graph_id: String,
    pub graph_name: String,
    pub nodes: Vec<BlueprintIrNode>,
    pub edges: Vec<BlueprintIrEdge>,
    pub entry_nodes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintCompileResult {
    pub success: bool,
    pub diagnostics: Vec<BlueprintDiagnostic>,
    pub ir: Option<BlueprintIr>,
    pub compile_time_micros: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintExecutionTrace {
    pub node_id: String,
    pub node_title: String,
    pub message: String,
    pub elapsed_micros: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintRunResult {
    pub success: bool,
    pub diagnostics: Vec<BlueprintDiagnostic>,
    pub traces: Vec<BlueprintExecutionTrace>,
    pub commands: Vec<BlueprintRuntimeCommand>,
    pub variables: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintRuntimeCommand {
    pub command_type: String,
    pub target: Option<String>,
    pub payload: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintNodeDefinition {
    pub type_id: String,
    pub display_name: String,
    pub category: String,
    pub description: String,
    pub runtime_supported: bool,
}
