use anyhow::{anyhow, Result};
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Emitter};

use crate::models::installer::{InstallConfig, InstallPlan, InstallResult, InstallerState};
use crate::services::{
    installer_association_service, installer_folder_service,
    installer_health_service, installer_log_service, installer_manifest_service,
    installer_settings_service, installer_shortcut_service, installer_system_service,
};

pub fn create_install_plan(config: InstallConfig) -> Result<InstallPlan> {
    let selected: Vec<_> = config.selected_components.iter().filter(|c| c.selected).cloned().collect();
    let missing: Vec<_> = selected.iter().filter(|c| c.required && !c.available).collect();
    if let Some(component) = missing.first() {
        return Err(anyhow!(component.error.clone().unwrap_or_else(|| format!("Missing required component {}", component.binary_name))));
    }
    let steps = vec![
        "Validate paths",
        "Create application folders",
        "Copy Forge Engine files",
        "Create user folders",
        "Write manifest",
        "Write settings",
        "Create shortcuts",
        "Register file associations",
        "Run health checks",
        "Finalize",
    ].into_iter().map(ToString::to_string).collect();
    Ok(InstallPlan {
        install_path: config.install_path,
        project_folder: config.project_folder,
        total_size_bytes: selected.iter().map(|c| c.size_bytes).sum(),
        components: selected,
        steps,
    })
}

pub fn run_install_plan(app: AppHandle, config: InstallConfig) -> Result<InstallResult> {
    let mut errors = Vec::new();
    emit(&app, "install_step_started", "Validate paths")?;
    installer_system_service::validate_install_path(config.install_path.clone())?;
    installer_system_service::validate_project_folder(config.project_folder.clone(), config.install_path.clone())?;
    emit(&app, "install_step_completed", "Validate paths")?;

    emit(&app, "install_step_started", "Create application folders")?;
    for folder in installer_folder_service::create_install_folders(&config)? {
        installer_log_service::append_installer_log(&format!("Created folder {}", folder))?;
    }
    emit(&app, "install_step_completed", "Create application folders")?;

    emit(&app, "install_step_started", "Copy Forge Engine files")?;
    copy_selected_components(&app, &config)?;
    copy_selected_content(&app, &config)?;
    create_launcher_files(&config)?;
    emit(&app, "install_step_completed", "Copy Forge Engine files")?;

    emit(&app, "install_step_started", "Create user folders")?;
    for folder in installer_folder_service::create_user_folders(&config)? {
        installer_log_service::append_installer_log(&format!("Created user folder {}", folder))?;
    }
    emit(&app, "install_step_completed", "Create user folders")?;

    emit(&app, "install_step_started", "Write manifest")?;
    let manifest_path = installer_manifest_service::write_manifest(&config)?;
    let version_path = installer_manifest_service::write_version_file(&config)?;
    emit(&app, "install_step_completed", "Write manifest")?;

    emit(&app, "install_step_started", "Write settings")?;
    installer_settings_service::write_default_settings(&config)?;
    persist_state(&config, Vec::new(), errors.clone())?;
    emit(&app, "install_step_completed", "Write settings")?;

    emit(&app, "install_step_started", "Create shortcuts")?;
    if config.create_desktop_shortcut {
        if let Err(error) = installer_shortcut_service::create_desktop_shortcut(&config) {
            errors.push(format!("Desktop shortcut failed: {}", error));
        }
    }
    if config.create_start_menu_shortcut {
        if let Err(error) = installer_shortcut_service::create_start_menu_shortcuts(&config) {
            errors.push(format!("Start menu shortcut failed: {}", error));
        }
    }
    emit(&app, "install_step_completed", "Create shortcuts")?;

    emit(&app, "install_step_started", "Register file associations")?;
    if config.register_file_associations {
        if let Err(error) = installer_association_service::register_file_associations(&config) {
            errors.push(format!("File associations failed: {}", error));
        }
    }
    emit(&app, "install_step_completed", "Register file associations")?;

    emit(&app, "install_step_started", "Run health checks")?;
    let health = installer_health_service::run_component_health_checks(&config)?;
    for result in &health {
        app.emit("health_check_completed", result).ok();
    }
    let failed_required = health.iter().any(|h| h.status == "failed");
    emit(&app, if failed_required { "install_step_failed" } else { "install_step_completed" }, "Run health checks")?;
    if failed_required {
        errors.push("One or more health checks failed.".to_string());
    }

    emit(&app, "install_step_started", "Finalize")?;
    installer_log_service::append_installer_log("Installation finalized")?;
    persist_state(&config, health.clone(), errors.clone())?;
    emit(&app, "install_step_completed", "Finalize")?;

    Ok(InstallResult {
        success: errors.is_empty(),
        manifest_path,
        version_path,
        health_checks: health,
        errors,
    })
}

pub fn repair_install(app: AppHandle, config: InstallConfig) -> Result<InstallResult> {
    run_install_plan(app, config)
}

pub fn update_install(app: AppHandle, config: InstallConfig) -> Result<InstallResult> {
    run_install_plan(app, config)
}

pub fn uninstall_install(install_path: String, remove_user_data: bool) -> Result<()> {
    let path = Path::new(&install_path);
    if path.exists() {
        fs::remove_dir_all(path)?;
    }
    installer_association_service::unregister_file_associations()?;
    if remove_user_data {
        let paths = installer_system_service::get_windows_user_paths()?;
        for folder in [paths.cache_dir, paths.shader_cache_dir, paths.asset_cache_dir, paths.build_cache_dir, paths.logs_dir, paths.temp_dir] {
            let _ = fs::remove_dir_all(folder);
        }
    }
    Ok(())
}

pub fn cancel_install() -> Result<()> {
    installer_log_service::append_installer_log("Install cancellation requested")?;
    Ok(())
}

fn copy_selected_components(app: &AppHandle, config: &InstallConfig) -> Result<()> {
    let bin = Path::new(&config.install_path).join("bin");
    fs::create_dir_all(&bin)?;
    for component in config.selected_components.iter().filter(|c| c.selected && !c.binary_name.is_empty()) {
        let Some(source) = &component.source_path else {
            return Err(anyhow!("Required component {} was not found. Build the component before running the installer.", component.binary_name));
        };
        let destination = bin.join(&component.binary_name);
        fs::copy(source, &destination)?;
        installer_log_service::append_installer_log(&format!("Copied {} to {}", source, destination.display()))?;
        app.emit("install_step_progress", serde_json::json!({"step": format!("Copy {}", component.display_name), "path": destination.to_string_lossy()})).ok();
    }
    Ok(())
}

fn copy_selected_content(app: &AppHandle, config: &InstallConfig) -> Result<()> {
    for component in config.selected_components.iter().filter(|c| c.selected && c.binary_name.is_empty() && c.source_path.is_some()) {
        let source = Path::new(component.source_path.as_ref().expect("checked above"));
        let destination = Path::new(&component.destination_path);
        copy_dir_recursive(source, destination)?;
        installer_log_service::append_installer_log(&format!("Copied content {} to {}", source.display(), destination.display()))?;
        app.emit("install_step_progress", serde_json::json!({"step": format!("Copy {}", component.display_name), "path": destination.to_string_lossy()})).ok();
    }
    Ok(())
}

fn copy_dir_recursive(source: &Path, destination: &Path) -> Result<()> {
    fs::create_dir_all(destination)?;
    for entry in walkdir::WalkDir::new(source).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        let relative = path.strip_prefix(source)?;
        let target = destination.join(relative);
        if path.is_dir() {
            fs::create_dir_all(&target)?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(path, target)?;
        }
    }
    Ok(())
}

fn create_launcher_files(config: &InstallConfig) -> Result<()> {
    let editor = Path::new(&config.install_path).join("bin\\forge_editor_core.exe");
    let engine = Path::new(&config.install_path).join("ForgeEngine.exe");
    let hub = Path::new(&config.install_path).join("ForgeHub.exe");
    let uninstall = Path::new(&config.install_path).join("uninstall.exe");
    if let Some(source_engine) = find_editor_launcher_source() {
        fs::copy(&source_engine, &engine)?;
        installer_log_service::append_installer_log(&format!("Copied editor launcher {} to {}", source_engine.display(), engine.display()))?;
    } else if editor.exists() {
        fs::copy(&editor, &engine)?;
        installer_log_service::append_installer_log("Copied forge_editor_core.exe as ForgeEngine.exe fallback")?;
    }
    if editor.exists() {
        fs::copy(&editor, &hub)?;
        fs::copy(&editor, &uninstall)?;
    }
    Ok(())
}

fn find_editor_launcher_source() -> Option<std::path::PathBuf> {
    let cwd = std::env::current_dir().ok()?;
    [
        cwd.join("artifacts\\windows\\ForgeEngine.exe"),
        cwd.join("target\\release\\ForgeEngine.exe"),
    ]
    .into_iter()
    .find(|path| path.exists())
}

fn persist_state(config: &InstallConfig, health_checks: Vec<crate::models::health::HealthCheckResult>, errors: Vec<String>) -> Result<()> {
    let state = InstallerState {
        current_step: 9,
        install_mode: config.install_mode.clone(),
        install_path: config.install_path.clone(),
        project_folder: config.project_folder.clone(),
        detected_existing_install: installer_system_service::check_existing_install(Some(config.install_path.clone())).ok(),
        installed_version: Some(installer_system_service::ENGINE_VERSION.to_string()),
        available_version: installer_system_service::ENGINE_VERSION.to_string(),
        selected_components: config.selected_components.clone(),
        system_checks: Vec::new(),
        health_checks,
        errors,
        logs: installer_log_service::read_installer_log().unwrap_or_default(),
    };
    installer_settings_service::write_installer_state(&state)?;
    Ok(())
}

fn emit(app: &AppHandle, event: &str, step: &str) -> Result<()> {
    installer_log_service::append_installer_log(&format!("{}: {}", event, step))?;
    app.emit(event, serde_json::json!({ "step": step }))?;
    app.emit("installer_log_line", format!("{}: {}", event, step)).ok();
    Ok(())
}
