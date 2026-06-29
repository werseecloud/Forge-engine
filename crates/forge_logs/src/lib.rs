use anyhow::Result;
use chrono::Utc;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy)]
pub enum LogFile {
    EditorCore,
    AssetWorker,
    BuildWorker,
    Runtime,
    RendererWorker,
    ShaderWorker,
}

impl LogFile {
    pub fn file_name(self) -> &'static str {
        match self {
            LogFile::EditorCore => "editor_core.log",
            LogFile::AssetWorker => "asset_worker.log",
            LogFile::BuildWorker => "build_worker.log",
            LogFile::Runtime => "runtime.log",
            LogFile::RendererWorker => "renderer_worker.log",
            LogFile::ShaderWorker => "shader_worker.log",
        }
    }
}

pub fn logs_dir() -> Result<PathBuf> {
    let local = dirs::data_local_dir().ok_or_else(|| anyhow::anyhow!("LocalAppData was not found"))?;
    let path = local.join("ForgeEngine").join("Logs");
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn log_path(file: LogFile) -> Result<PathBuf> {
    Ok(logs_dir()?.join(file.file_name()))
}

pub fn append_log(file: LogFile, message: &str) -> Result<String> {
    let path = log_path(file)?;
    let line = format!("[{}] {}\n", Utc::now().to_rfc3339(), message);
    let mut out = OpenOptions::new().create(true).append(true).open(path)?;
    out.write_all(line.as_bytes())?;
    Ok(line)
}
