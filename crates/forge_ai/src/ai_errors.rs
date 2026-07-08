use thiserror::Error;

pub type AiResult<T> = Result<T, AiError>;

#[derive(Debug, Error)]
pub enum AiError {
    #[error("unsupported model format: {0}")]
    UnsupportedModelFormat(String),
    #[error("model file is invalid: {0}")]
    InvalidModel(String),
    #[error("model not found: {0}")]
    ModelNotFound(String),
    #[error("no active local model is selected")]
    NoActiveModel,
    #[error("local inference backend is not installed: {0}")]
    BackendUnavailable(String),
    #[error("offline mode blocks cloud/API requests")]
    OfflineBlocksCloud,
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Other(String),
}
