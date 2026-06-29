use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub component_id: String,
    pub display_name: String,
    pub status: String,
    pub message: String,
    pub stdout: String,
    pub stderr: String,
}

