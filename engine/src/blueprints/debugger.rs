use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintDebugTrace {
    pub graph_id: String,
    pub node_id: String,
    pub message: String,
    pub elapsed_micros: u128,
}
