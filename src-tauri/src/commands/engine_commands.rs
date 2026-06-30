use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{AppHandle, Emitter};

use crate::services::log_service;
use crate::utils::{embedded_skyboxes, embedded_workers};
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineBootStatus {
    pub label: String,
    pub detail: String,
}

#[tauri::command]
pub fn start_engine_services(app: AppHandle) -> CommandResult<Vec<EngineBootStep>> {
    start_services(&app).map_err(command_error)
}

fn emit_status(app: &AppHandle, label: &str, detail: &str) {
    let _ = app.emit(
        "engine_boot_status",
        EngineBootStatus {
            label: label.to_string(),
            detail: detail.to_string(),
        },
    );
}

fn start_services(app: &AppHandle) -> anyhow::Result<Vec<EngineBootStep>> {
    emit_status(app, "Preparing workers", "Resolving embedded Forge Engine services");
    let installed_bin = embedded_workers::ensure_worker_binaries_installed()?;
    log_service::append_output_log(&format!(
        "Worker binaries installed/resolved in {}",
        installed_bin.display()
    ))
    .ok();
    emit_status(app, "Preparing skyboxes", "Installing embedded HDR skybox assets");
    let skyboxes = embedded_skyboxes::ensure_embedded_skyboxes_installed()?;
    log_service::append_output_log(&format!(
        "Embedded skyboxes installed/resolved: {} variants",
        skyboxes.skyboxes.len()
    ))
    .ok();
    let components = [
        "forge_renderer_worker.exe",
        "forge_runtime.exe",
        "forge_shader_worker.exe",
        "forge_asset_worker.exe",
        "forge_build_worker.exe",
    ];
    let mut steps = Vec::new();
    for component in components {
        emit_status(
            app,
            "Checking service",
            &format!("Running health check for {}", component),
        );
        let Some(path) = embedded_workers::find_worker_binary(component) else {
            let step = EngineBootStep {
                component: component.to_string(),
                command: component.to_string(),
                status: "missing".to_string(),
                stdout: String::new(),
                stderr: "Component executable was not found on disk.".to_string(),
            };
            log_service::append_output_log(&format!("Engine boot missing {}", component)).ok();
            let _ = app.emit("engine_boot_step_completed", &step);
            steps.push(step);
            continue;
        };
        let output = Command::new(&path).arg("--health-check").output()?;
        let status = if output.status.success() {
            "ok"
        } else {
            "failed"
        };
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        log_service::append_output_log(&format!("Engine boot {}: {}", component, status)).ok();
        let step = EngineBootStep {
            component: component.to_string(),
            command: format!("{} --health-check", path.display()),
            status: status.to_string(),
            stdout,
            stderr,
        };
        let _ = app.emit("engine_boot_step_completed", &step);
        steps.push(step);
    }
    emit_status(app, "Finalizing startup", "Opening Forge Engine editor");
    Ok(steps)
}
