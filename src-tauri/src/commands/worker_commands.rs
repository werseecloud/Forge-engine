use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Child, Command};
use std::sync::{Mutex, OnceLock};

use crate::utils::embedded_workers;
use crate::utils::errors::{command_error, CommandResult};

static WORKERS: OnceLock<Mutex<HashMap<String, Child>>> = OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerStartRequest {
    pub name: String,
    pub project_path: Option<String>,
    pub ipc_port: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerStatus {
    pub name: String,
    pub pid: Option<u32>,
    pub state: String,
    pub binary_path: Option<String>,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerHealthOutput {
    pub name: String,
    pub command: String,
    pub status: String,
    pub stdout: String,
    pub stderr: String,
}

#[tauri::command]
pub fn start_worker(request: WorkerStartRequest) -> CommandResult<WorkerStatus> {
    start_worker_inner(request).map_err(command_error)
}

#[tauri::command]
pub fn stop_worker(name: String) -> CommandResult<WorkerStatus> {
    let table = workers();
    let mut table = table
        .lock()
        .map_err(|_| command_error("worker table lock failed"))?;
    if let Some(mut child) = table.remove(&name) {
        let _ = child.kill();
        let _ = child.wait();
        return Ok(WorkerStatus {
            name,
            pid: None,
            state: "Stopped".to_string(),
            binary_path: None,
            last_error: None,
        });
    }
    Ok(WorkerStatus {
        name,
        pid: None,
        state: "WorkerUnavailable".to_string(),
        binary_path: None,
        last_error: Some("Worker was not running".to_string()),
    })
}

#[tauri::command]
pub fn restart_worker(request: WorkerStartRequest) -> CommandResult<WorkerStatus> {
    let _ = stop_worker(request.name.clone());
    start_worker(request)
}

#[tauri::command]
pub fn get_worker_status(name: String) -> CommandResult<WorkerStatus> {
    embedded_workers::ensure_worker_binaries_installed().ok();
    let table = workers();
    let mut table = table
        .lock()
        .map_err(|_| command_error("worker table lock failed"))?;
    if let Some(child) = table.get_mut(&name) {
        let pid = child.id();
        let state = match child.try_wait().map_err(command_error)? {
            Some(status) => format!("Exited({})", status),
            None => "Running".to_string(),
        };
        return Ok(WorkerStatus {
            name: name.clone(),
            pid: Some(pid),
            state,
            binary_path: embedded_workers::find_worker_binary(&name)
                .map(|p| p.to_string_lossy().to_string()),
            last_error: None,
        });
    }
    Ok(WorkerStatus {
        name: name.clone(),
        pid: None,
        state: "Stopped".to_string(),
        binary_path: embedded_workers::find_worker_binary(&name)
            .map(|p| p.to_string_lossy().to_string()),
        last_error: None,
    })
}

#[tauri::command]
pub fn run_worker_health_check(name: String) -> CommandResult<WorkerHealthOutput> {
    run_health_inner(name).map_err(command_error)
}

fn start_worker_inner(request: WorkerStartRequest) -> anyhow::Result<WorkerStatus> {
    embedded_workers::ensure_worker_binaries_installed()?;
    let binary = embedded_workers::find_worker_binary(&request.name)
        .ok_or_else(|| anyhow::anyhow!("WorkerUnavailable: {}", request.name))?;
    let mut command = Command::new(&binary);
    if let Some(project) = &request.project_path {
        command.arg("--project").arg(project);
    }
    let paths = forge_settings::ensure_user_paths()?;
    command.arg("--log-dir").arg(paths.logs_dir);
    if let Some(port) = request.ipc_port {
        command.arg("--ipc-port").arg(port.to_string());
    }
    let child = command.spawn()?;
    let pid = child.id();
    workers()
        .lock()
        .map_err(|_| anyhow::anyhow!("worker table lock failed"))?
        .insert(request.name.clone(), child);
    Ok(WorkerStatus {
        name: request.name,
        pid: Some(pid),
        state: "Running".to_string(),
        binary_path: Some(binary.to_string_lossy().to_string()),
        last_error: None,
    })
}

fn run_health_inner(name: String) -> anyhow::Result<WorkerHealthOutput> {
    embedded_workers::ensure_worker_binaries_installed()?;
    let binary = embedded_workers::find_worker_binary(&name)
        .ok_or_else(|| anyhow::anyhow!("WorkerUnavailable: {}", name))?;
    let output = Command::new(&binary).arg("--health-check").output()?;
    Ok(WorkerHealthOutput {
        name,
        command: format!("{} --health-check", binary.display()),
        status: if output.status.success() {
            "ok"
        } else {
            "failed"
        }
        .to_string(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
    })
}

fn workers() -> &'static Mutex<HashMap<String, Child>> {
    WORKERS.get_or_init(|| Mutex::new(HashMap::new()))
}
