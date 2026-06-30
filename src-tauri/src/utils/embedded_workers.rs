use anyhow::{anyhow, Result};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

use crate::services::log_service;

pub struct EmbeddedWorker {
    pub file_name: &'static str,
    pub bytes: &'static [u8],
}

include!(concat!(env!("OUT_DIR"), "/embedded_workers.rs"));

pub const REQUIRED_WORKERS: &[&str] = &[
    "forge_renderer_worker.exe",
    "forge_runtime.exe",
    "forge_shader_worker.exe",
    "forge_asset_worker.exe",
    "forge_build_worker.exe",
];

pub fn ensure_worker_binaries_installed() -> Result<PathBuf> {
    let bin_dir = worker_bin_dir()?;
    fs::create_dir_all(&bin_dir)?;

    for worker in REQUIRED_WORKERS {
        let destination = bin_dir.join(worker);
        if let Some(embedded) = EMBEDDED_WORKERS
            .iter()
            .find(|item| item.file_name == *worker)
        {
            write_if_changed(&destination, embedded.bytes)?;
            log_service::append_output_log(&format!(
                "Worker available in app data: {}",
                destination.display()
            ))
            .ok();
        } else if !destination.exists() {
            if let Some(source) = find_development_worker(worker) {
                fs::copy(&source, &destination)?;
                log_service::append_output_log(&format!(
                    "Copied worker {} to {}",
                    source.display(),
                    destination.display()
                ))
                .ok();
            } else {
                return Err(anyhow!(
                    "WorkerUnavailable: {} is not embedded and was not found in target/release",
                    worker
                ));
            }
        }
    }

    Ok(bin_dir)
}

pub fn find_worker_binary(name: &str) -> Option<PathBuf> {
    let exe_name = if name.ends_with(".exe") {
        name.to_string()
    } else {
        format!("{name}.exe")
    };
    if let Ok(bin_dir) = worker_bin_dir() {
        let installed = bin_dir.join(&exe_name);
        if installed.exists() {
            return Some(installed);
        }
    }

    let exe = std::env::current_exe().ok();
    let cwd = std::env::current_dir().ok();
    let mut candidates = Vec::new();
    if let Some(exe) = exe.as_ref().and_then(|p| p.parent()) {
        candidates.push(exe.join("bin").join(&exe_name));
        candidates.push(exe.join(&exe_name));
    }
    if let Some(cwd) = cwd.as_ref() {
        candidates.push(cwd.join("target").join("release").join(&exe_name));
        candidates.push(cwd.join("bin").join(&exe_name));
        candidates.push(cwd.join(&exe_name));
    }
    candidates.into_iter().find(|path| path.exists())
}

pub fn worker_bin_dir() -> Result<PathBuf> {
    let local = dirs::data_local_dir().ok_or_else(|| anyhow!("LocalAppData was not found"))?;
    Ok(local.join("ForgeEngine").join("Workers").join("bin"))
}

fn find_development_worker(worker: &str) -> Option<PathBuf> {
    let cwd = std::env::current_dir().ok()?;
    [
        cwd.join("target").join("release").join(worker),
        cwd.join("bin").join(worker),
        cwd.join(worker),
    ]
    .into_iter()
    .find(|path| path.exists())
}

fn write_if_changed(destination: &Path, bytes: &[u8]) -> Result<()> {
    if destination.exists() {
        let existing = fs::read(destination)?;
        if sha256(&existing) == sha256(bytes) {
            return Ok(());
        }
    }
    fs::write(destination, bytes)?;
    Ok(())
}

fn sha256(bytes: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hasher.finalize().to_vec()
}
