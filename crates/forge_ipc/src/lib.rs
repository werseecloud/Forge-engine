use chrono::{DateTime, Utc};
use forge_errors::ForgeErrorResponse;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkerName {
    EditorCore,
    AssetWorker,
    BuildWorker,
    Runtime,
    RendererWorker,
    ShaderWorker,
    AiRuntime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcEnvelope<T> {
    pub request_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub worker_name: WorkerName,
    pub payload: T,
}

impl<T> IpcEnvelope<T> {
    pub fn new(worker_name: WorkerName, payload: T) -> Self {
        Self {
            request_id: Uuid::new_v4(),
            timestamp: Utc::now(),
            worker_name,
            payload,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcResponse {
    pub request_id: Uuid,
    pub ok: bool,
    pub result: Option<Value>,
    pub error: Option<ForgeErrorResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WorkerCommand {
    Ping,
    Shutdown,
    GetStatus,
    GetLogs,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WorkerEvent {
    Ready,
    Pong,
    StatusChanged { status: String },
    LogLine { line: String },
    Error { error: ForgeErrorResponse },
    ShutdownAck,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AssetWorkerCommand {
    ImportAssets { source_paths: Vec<String>, destination_relative: String, conflict: String },
    ScanAssets,
    RebuildAssetIndex,
    WatchProject,
    StopWatchingProject,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ShaderWorkerCommand {
    CompileShader { shader_path: String },
    CompileShaderBatch { shader_paths: Vec<String> },
    WatchShaderDirectory { path: String },
    ReloadShader { shader_path: String },
    ClearShaderCache,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RendererWorkerCommand {
    CreateViewport { width: u32, height: u32 },
    ResizeViewport { width: u32, height: u32 },
    LoadScene { scene_path: String },
    UpdateSceneSnapshot { scene_json: Value },
    SetRenderMode { mode: String },
    ReloadShaders,
    RequestRenderStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RuntimeCommand {
    StartPlayMode { project_path: String, scene_path: String },
    Pause,
    Resume,
    Stop,
    StepFrame,
    LoadScene { scene_path: String },
    GetRuntimeStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BuildWorkerCommand {
    ValidateProject { project_path: String },
    BuildProject { project_path: String, target: String },
    CancelBuild,
    CleanBuildCache,
    GetBuildLogs,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Heartbeat {
    pub worker_name: WorkerName,
    pub pid: u32,
    pub status: String,
    pub timestamp: DateTime<Utc>,
}
