use anyhow::Result;
use chrono::Utc;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

use crate::services::installer_system_service;

pub fn installer_log_path() -> Result<String> {
    Ok(installer_system_service::get_windows_user_paths()?.logs_dir + "\\installer.log")
}

pub fn append_installer_log(message: &str) -> Result<String> {
    let path = installer_log_path()?;
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)?;
    }
    let line = format!("[{}] {}\n", Utc::now().to_rfc3339(), message);
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    file.write_all(line.as_bytes())?;
    Ok(line)
}

pub fn read_installer_log() -> Result<Vec<String>> {
    let path = installer_log_path()?;
    if !Path::new(&path).exists() {
        return Ok(Vec::new());
    }
    Ok(fs::read_to_string(path)?.lines().map(ToString::to_string).collect())
}

pub fn clear_installer_log() -> Result<()> {
    let path = installer_log_path()?;
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, "")?;
    Ok(())
}

