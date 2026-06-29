use anyhow::Result;
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::models::installer::InstallConfig;
use crate::services::installer_system_service::get_windows_user_paths;

pub fn create_install_folders(config: &InstallConfig) -> Result<Vec<String>> {
    let mut created = Vec::new();
    for folder in [
        "",
        "bin",
        "engine\\Config",
        "engine\\Templates",
        "engine\\StarterContent",
        "engine\\Shaders",
        "engine\\Runtime",
        "engine\\Plugins",
        "engine\\Tools",
        "docs",
        "licenses",
    ] {
        let path = Path::new(&config.install_path).join(folder);
        fs::create_dir_all(&path)?;
        created.push(path.to_string_lossy().to_string());
    }
    Ok(created)
}

pub fn create_user_folders(_config: &InstallConfig) -> Result<Vec<String>> {
    let paths = get_windows_user_paths()?;
    let folders = vec![
        paths.documents_root,
        paths.projects_dir,
        paths.templates_dir,
        paths.backups_dir,
        paths.exports_dir,
        paths.local_root,
        paths.cache_dir,
        paths.shader_cache_dir,
        paths.asset_cache_dir,
        paths.build_cache_dir,
        paths.logs_dir,
        paths.temp_dir,
        paths.crash_reports_dir,
        paths.worker_logs_dir,
        paths.roaming_root,
    ];
    for folder in &folders {
        fs::create_dir_all(folder)?;
    }
    Ok(folders)
}

pub fn open_folder(path: String) -> Result<()> {
    Command::new("explorer").arg(path).spawn()?;
    Ok(())
}

