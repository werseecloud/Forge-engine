use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Child, Command};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerLaunchConfig {
    pub name: String,
    pub binary_path: PathBuf,
    pub project_path: Option<PathBuf>,
    pub log_dir: Option<PathBuf>,
    pub ipc_port: Option<u16>,
    pub pipe_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerProcessInfo {
    pub name: String,
    pub pid: u32,
    pub status: String,
}

pub fn launch_worker(config: &WorkerLaunchConfig) -> Result<(Child, WorkerProcessInfo)> {
    if !config.binary_path.exists() {
        return Err(anyhow!("WorkerUnavailable: {}", config.binary_path.display()));
    }
    let mut command = Command::new(&config.binary_path);
    if let Some(project) = &config.project_path {
        command.arg("--project").arg(project);
    }
    if let Some(log_dir) = &config.log_dir {
        command.arg("--log-dir").arg(log_dir);
    }
    if let Some(port) = config.ipc_port {
        command.arg("--ipc-port").arg(port.to_string());
    }
    if let Some(pipe) = &config.pipe_name {
        command.arg("--pipe").arg(pipe);
    }
    let child = command.spawn()?;
    let info = WorkerProcessInfo {
        name: config.name.clone(),
        pid: child.id(),
        status: "running".to_string(),
    };
    Ok((child, info))
}
