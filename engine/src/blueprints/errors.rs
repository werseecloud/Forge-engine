use thiserror::Error;

#[derive(Debug, Error)]
pub enum BlueprintError {
    #[error("missing node type: {0}")]
    MissingNodeType(String),
    #[error("invalid pin connection: {0}")]
    InvalidPinConnection(String),
    #[error("runtime execution failed: {0}")]
    Runtime(String),
}
