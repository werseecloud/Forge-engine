use anyhow::Result;
use std::path::Path;
use std::process::Command;

use crate::models::health::HealthCheckResult;
use crate::models::installer::InstallConfig;

pub fn run_component_health_checks(config: &InstallConfig) -> Result<Vec<HealthCheckResult>> {
    let mut results = Vec::new();
    for component in config.selected_components.iter().filter(|c| c.selected && !c.binary_name.is_empty()) {
        results.push(run_single_component_health_check(config.clone(), component.id.clone())?);
    }
    for (id, display, path) in [
        ("project_folders", "Project folders", config.project_folder.clone()),
        ("settings_files", "Settings files", crate::services::installer_system_service::get_windows_user_paths()?.settings_path),
        ("cache_folders", "Cache folders", crate::services::installer_system_service::get_windows_user_paths()?.cache_dir),
    ] {
        let exists = Path::new(&path).exists();
        results.push(HealthCheckResult {
            component_id: id.to_string(),
            display_name: display.to_string(),
            status: if exists { "passed" } else { "failed" }.to_string(),
            message: if exists { "Verified on disk.".to_string() } else { format!("Missing {}", path) },
            stdout: String::new(),
            stderr: String::new(),
        });
    }
    Ok(results)
}

pub fn run_single_component_health_check(config: InstallConfig, component_id: String) -> Result<HealthCheckResult> {
    let Some(component) = config.selected_components.iter().find(|c| c.id == component_id) else {
        return Ok(HealthCheckResult { component_id, display_name: "Unknown".to_string(), status: "failed".to_string(), message: "Component not selected.".to_string(), stdout: String::new(), stderr: String::new() });
    };
    let path = Path::new(&config.install_path).join("bin").join(&component.binary_name);
    if !path.exists() {
        return Ok(HealthCheckResult { component_id: component.id.clone(), display_name: component.display_name.clone(), status: "failed".to_string(), message: format!("Missing binary: {}", path.display()), stdout: String::new(), stderr: String::new() });
    }
    let output = Command::new(&path).arg("--health-check").output();
    match output {
        Ok(out) if out.status.success() => Ok(HealthCheckResult {
            component_id: component.id.clone(),
            display_name: component.display_name.clone(),
            status: "passed".to_string(),
            message: "Health check passed.".to_string(),
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
        }),
        _ => {
            let version = Command::new(&path).arg("--version").output();
            match version {
                Ok(out) if out.status.success() => Ok(HealthCheckResult {
                    component_id: component.id.clone(),
                    display_name: component.display_name.clone(),
                    status: "warning".to_string(),
                    message: "Health check unsupported, but --version succeeded.".to_string(),
                    stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                }),
                Ok(out) => Ok(HealthCheckResult {
                    component_id: component.id.clone(),
                    display_name: component.display_name.clone(),
                    status: if component.required { "failed" } else { "warning" }.to_string(),
                    message: "Binary exists, but health and version checks failed.".to_string(),
                    stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                }),
                Err(error) => Ok(HealthCheckResult {
                    component_id: component.id.clone(),
                    display_name: component.display_name.clone(),
                    status: if component.required { "failed" } else { "warning" }.to_string(),
                    message: error.to_string(),
                    stdout: String::new(),
                    stderr: String::new(),
                }),
            }
        }
    }
}

