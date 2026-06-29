use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::services::log_service;
use crate::utils::errors::{command_error, CommandResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineBootStep {
    pub component: String,
    pub command: String,
    pub status: String,
    pub stdout: String,
    pub stderr: String,
}

#[tauri::command]
pub fn start_engine_services() -> CommandResult<Vec<EngineBootStep>> {
    start_services().map_err(command_error)
}

fn start_services() -> anyhow::Result<Vec<EngineBootStep>> {
    let components = [
        "forge_renderer_worker.exe",
        "forge_runtime.exe",
        "forge_shader_worker.exe",
        "forge_asset_worker.exe",
        "forge_build_worker.exe",
    ];
    let mut steps = Vec::new();
    for component in components {
        let Some(path) = find_component(component) else {
            let step = EngineBootStep {
                component: component.to_string(),
                command: component.to_string(),
                status: "missing".to_string(),
                stdout: String::new(),
                stderr: "Component executable was not found on disk.".to_string(),
            };
            log_service::append_output_log(&format!("Engine boot missing {}", component)).ok();
            steps.push(step);
            continue;
        };
        let output = Command::new(&path).arg("--health-check").output()?;
        let status = if output.status.success() { "ok" } else { "failed" };
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        log_service::append_output_log(&format!("Engine boot {}: {}", component, status)).ok();
        steps.push(EngineBootStep {
            component: component.to_string(),
            command: format!("{} --health-check", path.display()),
            status: status.to_string(),
            stdout,
            stderr,
        });
    }
    Ok(steps)
}

fn find_component(component: &str) -> Option<PathBuf> {
    let exe = std::env::current_exe().ok();
    let cwd = std::env::current_dir().ok();
    let mut candidates = Vec::new();
    if let Some(exe) = exe.as_ref() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.join("bin").join(component));
            candidates.push(parent.join(component));
        }
    }
    if let Some(cwd) = cwd.as_ref() {
        candidates.push(cwd.join("target").join("release").join(component));
        candidates.push(cwd.join("bin").join(component));
        candidates.push(cwd.join(component));
    }
    candidates.into_iter().find(|path| Path::new(path).exists())
}
