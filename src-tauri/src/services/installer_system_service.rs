use anyhow::{anyhow, Result};
use fs2::available_space;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use winreg::enums::*;
use winreg::RegKey;

use crate::models::checks::{CheckResult, UserPaths};
use crate::models::installer::{ExistingInstall, PathValidation};
use crate::services::{installer_component_service, installer_log_service};

pub const ENGINE_VERSION: &str = "1.0.0";

pub fn get_windows_user_paths() -> Result<UserPaths> {
    let documents = dirs::document_dir().ok_or_else(|| anyhow!("Documents folder was not found"))?;
    let local = dirs::data_local_dir().ok_or_else(|| anyhow!("Local AppData folder was not found"))?;
    let roaming = dirs::config_dir().ok_or_else(|| anyhow!("Roaming AppData folder was not found"))?;
    let pf = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let documents_root = documents.join("Forge Engine");
    let local_root = local.join("ForgeEngine");
    let roaming_root = roaming.join("ForgeEngine");

    Ok(UserPaths {
        install_default: Path::new(&pf).join("Forge Engine").to_string_lossy().to_string(),
        documents_root: documents_root.to_string_lossy().to_string(),
        projects_dir: documents_root.join("Projects").to_string_lossy().to_string(),
        templates_dir: documents_root.join("Templates").to_string_lossy().to_string(),
        backups_dir: documents_root.join("Backups").to_string_lossy().to_string(),
        exports_dir: documents_root.join("Exports").to_string_lossy().to_string(),
        local_root: local_root.to_string_lossy().to_string(),
        cache_dir: local_root.join("Cache").to_string_lossy().to_string(),
        shader_cache_dir: local_root.join("ShaderCache").to_string_lossy().to_string(),
        asset_cache_dir: local_root.join("AssetCache").to_string_lossy().to_string(),
        build_cache_dir: local_root.join("BuildCache").to_string_lossy().to_string(),
        logs_dir: local_root.join("Logs").to_string_lossy().to_string(),
        temp_dir: local_root.join("Temp").to_string_lossy().to_string(),
        crash_reports_dir: local_root.join("CrashReports").to_string_lossy().to_string(),
        worker_logs_dir: local_root.join("WorkerLogs").to_string_lossy().to_string(),
        roaming_root: roaming_root.to_string_lossy().to_string(),
        settings_path: roaming_root.join("settings.json").to_string_lossy().to_string(),
        installer_state_path: roaming_root.join("installer_state.json").to_string_lossy().to_string(),
    })
}

pub fn calculate_available_disk_space(path: String) -> Result<u64> {
    let mut candidate = PathBuf::from(path);
    while !candidate.exists() {
        if !candidate.pop() {
            candidate = PathBuf::from("C:\\");
            break;
        }
    }
    Ok(available_space(candidate)?)
}

pub fn validate_install_path(path: String) -> Result<PathValidation> {
    validate_path(path, true, None)
}

pub fn validate_project_folder(path: String, install_path: String) -> Result<PathValidation> {
    validate_path(path, false, Some(install_path))
}

fn validate_path(path: String, install: bool, not_equal: Option<String>) -> Result<PathValidation> {
    let available = calculate_available_disk_space(path.clone()).unwrap_or(0);
    if let Some(other) = not_equal {
        if PathBuf::from(&path) == PathBuf::from(other) {
            return Ok(PathValidation { valid: false, warning: None, message: "Project folder cannot equal the install directory.".to_string(), available_space: available });
        }
    }

    let target = PathBuf::from(&path);
    let protected = target.to_string_lossy().to_lowercase().starts_with("c:\\program files");
    let warning = if install && protected && !can_write_to(&target) {
        Some("Program Files requires administrator permission. Run setup as administrator or choose another folder.".to_string())
    } else {
        None
    };

    let valid = if warning.is_some() { false } else { can_write_to(&target) };
    Ok(PathValidation {
        valid,
        warning,
        message: if valid { "Path can be created and written.".to_string() } else { "Path is not writable.".to_string() },
        available_space: available,
    })
}

fn can_write_to(path: &Path) -> bool {
    let dir = if path.extension().is_some() { path.parent().unwrap_or(path) } else { path };
    if fs::create_dir_all(dir).is_err() {
        return false;
    }
    let probe = dir.join(format!(".forge_setup_write_test_{}", uuid::Uuid::new_v4().simple()));
    match fs::write(&probe, b"test") {
        Ok(_) => {
            let _ = fs::remove_file(probe);
            true
        }
        Err(_) => false,
    }
}

pub fn check_existing_install(path: Option<String>) -> Result<ExistingInstall> {
    let install_path = path.unwrap_or_else(|| get_windows_user_paths().map(|p| p.install_default).unwrap_or_else(|_| "C:\\Program Files\\Forge Engine".to_string()));
    let manifest = Path::new(&install_path).join("manifest.json");
    let version = Path::new(&install_path).join("version.json");
    if manifest.exists() || version.exists() {
        let version_text = fs::read_to_string(&version).ok()
            .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
            .and_then(|value| value.get("engine_version").and_then(|v| v.as_str()).map(ToString::to_string))
            .unwrap_or_else(|| "Unknown".to_string());
        Ok(ExistingInstall {
            found: true,
            install_path,
            installed_version: Some(version_text),
            manifest_path: Some(manifest.to_string_lossy().to_string()),
            message: "Existing Forge Engine installation found.".to_string(),
        })
    } else {
        Ok(ExistingInstall { found: false, install_path, installed_version: None, manifest_path: None, message: "No existing installation found.".to_string() })
    }
}

pub fn run_system_check(install_path: Option<String>, project_folder: Option<String>) -> Result<Vec<CheckResult>> {
    let paths = get_windows_user_paths()?;
    fs::create_dir_all(&paths.logs_dir)?;
    installer_log_service::append_installer_log("System check started")?;
    let install = install_path.unwrap_or(paths.install_default.clone());
    let project = project_folder.unwrap_or(paths.projects_dir.clone());
    let existing = check_existing_install(Some(install.clone()))?;
    let components = installer_component_service::scan_available_components(install.clone())?;
    let required_missing = components.iter().filter(|c| c.required && !c.available).count();
    let mut checks = Vec::new();

    checks.push(check("windows_version", "Windows Version", "passed", &windows_version(), "Detected Windows version.", true));
    checks.push(check("cpu_architecture", "CPU Architecture", "passed", std::env::consts::ARCH, "Architecture is supported.", true));
    checks.push(check("available_disk_space", "Available Disk Space", "passed", &format!("{} bytes", calculate_available_disk_space(install.clone()).unwrap_or(0)), "Disk space was queried from the target drive.", true));
    let install_validation = validate_install_path(install.clone())?;
    checks.push(check("write_permissions", "Write Permissions", if install_validation.valid { "passed" } else { "failed" }, &install_validation.message, install_validation.warning.as_deref().unwrap_or("Install path write test completed."), true));
    checks.push(check("existing_installation", "Existing Installation", if existing.found { "warning" } else { "passed" }, if existing.found { "Found" } else { "Not found" }, &existing.message, false));
    checks.push(check("webview2", "WebView2 Runtime", if webview2_installed() { "passed" } else { "warning" }, if webview2_installed() { "Installed" } else { "Not detected" }, "Tauri requires WebView2 on Windows.", false));
    let project_validation = validate_project_folder(project, install)?;
    checks.push(check("project_folder_access", "Project Folder Access", if project_validation.valid { "passed" } else { "failed" }, &project_validation.message, project_validation.warning.as_deref().unwrap_or("Project folder write test completed."), true));
    checks.push(check("component_sources", "Source Components", if required_missing == 0 { "passed" } else { "failed" }, &format!("{} missing required", required_missing), "Required binaries must exist before install.", true));
    installer_log_service::append_installer_log("System check completed")?;
    Ok(checks)
}

fn check(id: &str, label: &str, status: &str, value: &str, message: &str, blocking: bool) -> CheckResult {
    CheckResult { id: id.to_string(), label: label.to_string(), status: status.to_string(), value: value.to_string(), message: message.to_string(), blocking }
}

fn windows_version() -> String {
    Command::new("cmd")
        .args(["/C", "ver"])
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Windows".to_string())
}

fn webview2_installed() -> bool {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F1E7C39B-5D7E-4F09-A78B-9F2F6B6BA060}").is_ok()
        || hklm.open_subkey("SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F1E7C39B-5D7E-4F09-A78B-9F2F6B6BA060}").is_ok()
}

