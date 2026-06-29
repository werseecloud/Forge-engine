use anyhow::Result;
use chrono::Utc;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

use crate::utils::paths::ensure_app_directories;

fn log_path() -> Result<String> {
    let dirs = ensure_app_directories()?;
    Ok(Path::new(&dirs.logs_dir)
        .join("editor.log")
        .to_string_lossy()
        .to_string())
}

pub fn append_output_log(message: &str) -> Result<String> {
    let path = log_path()?;
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)?;
    }
    let line = format!("[{}] {}\n", Utc::now().to_rfc3339(), message);
    let mut file = OpenOptions::new().create(true).append(true).open(&path)?;
    file.write_all(line.as_bytes())?;
    Ok(line)
}

pub fn read_output_log() -> Result<Vec<String>> {
    let path = log_path()?;
    if !Path::new(&path).exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path)?;
    Ok(content.lines().map(ToString::to_string).collect())
}

pub fn clear_output_log() -> Result<()> {
    let path = log_path()?;
    fs::write(path, "")?;
    Ok(())
}

