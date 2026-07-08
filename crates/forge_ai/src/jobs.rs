use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub type AiJobId = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum AiJobStatus {
    Queued,
    Running,
    Completed,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiJob {
    pub job_id: AiJobId,
    pub status: AiJobStatus,
    pub created_at: String,
    pub error: Option<String>,
}

impl AiJob {
    pub fn queued() -> Self {
        Self {
            job_id: Uuid::new_v4().to_string(),
            status: AiJobStatus::Queued,
            created_at: Utc::now().to_rfc3339(),
            error: None,
        }
    }
}
