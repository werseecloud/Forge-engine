use thiserror::Error;

#[derive(Debug, Error)]
pub enum RendererError {
    #[error("GPU initialization failed: {0}")]
    GpuInit(#[from] GpuInitError),
    #[error("shader error: {0}")]
    Shader(#[from] ShaderError),
    #[error("IPC error: {0}")]
    Ipc(#[from] IpcError),
    #[error("scene sync error: {0}")]
    SceneSync(#[from] SceneSyncError),
    #[error("resource error: {0}")]
    Resource(#[from] ResourceError),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

#[derive(Debug, Error)]
pub enum GpuInitError {
    #[error("no compatible GPU adapter was found")]
    NoAdapter,
    #[error("device request failed: {0}")]
    RequestDevice(String),
}

#[derive(Debug, Error)]
pub enum ShaderError {
    #[error("shader file does not exist: {0}")]
    MissingFile(String),
    #[error("shader IO failed: {0}")]
    Io(String),
    #[error("shader compile failed: {0}")]
    Compile(String),
}

#[derive(Debug, Error)]
pub enum IpcError {
    #[error("invalid renderer message: {0}")]
    InvalidMessage(String),
    #[error("transport failed: {0}")]
    Transport(String),
}

#[derive(Debug, Error)]
pub enum SceneSyncError {
    #[error("scene snapshot version is invalid")]
    InvalidVersion,
}

#[derive(Debug, Error)]
pub enum ResourceError {
    #[error("resource was not found: {0}")]
    NotFound(String),
    #[error("resource key already exists: {0}")]
    Duplicate(String),
}

