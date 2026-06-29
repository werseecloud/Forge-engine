use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ForgeStatusCode {
    Ok,
    NotConfigured,
    MissingProject,
    MissingAsset,
    Unsupported,
    WorkerUnavailable,
    NoSceneLoaded,
    NotImplementedYet,
    IoError,
    InvalidRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForgeErrorResponse {
    pub code: ForgeStatusCode,
    pub message: String,
    pub recovery_action: Option<String>,
}

impl ForgeErrorResponse {
    pub fn new(code: ForgeStatusCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            recovery_action: None,
        }
    }
}

#[derive(Debug, Error)]
pub enum ForgeError {
    #[error("{0}")]
    Message(String),
    #[error("unsupported: {0}")]
    Unsupported(String),
    #[error("missing project: {0}")]
    MissingProject(String),
    #[error("worker unavailable: {0}")]
    WorkerUnavailable(String),
}
