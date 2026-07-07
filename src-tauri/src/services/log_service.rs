use anyhow::Result;
use chrono::Utc;
use std::fs::{self, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;

const MAX_LOG_BYTES_TO_READ: u64 = 256 * 1024;
const MAX_LOG_LINES_TO_RETURN: usize = 1000;

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
    let mut file = fs::File::open(path)?;
    let len = file.metadata()?.len();
    let start = len.saturating_sub(MAX_LOG_BYTES_TO_READ);
    file.seek(SeekFrom::Start(start))?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    let mut lines = content
        .lines()
        .map(ToString::to_string)
        .collect::<Vec<_>>();
    if start > 0 && !lines.is_empty() {
        lines.remove(0);
    }
    if lines.len() > MAX_LOG_LINES_TO_RETURN {
        lines = lines[lines.len() - MAX_LOG_LINES_TO_RETURN..].to_vec();
    }
    Ok(lines)
}

pub fn clear_output_log() -> Result<()> {
    let path = log_path()?;
    fs::write(path, "")?;
    Ok(())
}

