use anyhow::{anyhow, Result};
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
    let cwd = std::env::current_dir().ok();
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf));
    let mut roots = Vec::new();
    if let Some(dir) = exe_dir {
        roots.push(dir.clone());
        roots.push(dir.join(".."));
        roots.push(dir.join("..").join(".."));
    }
    if let Some(dir) = cwd {
        roots.push(dir.clone());
        roots.push(dir.join(".."));
        roots.push(dir.join("..").join(".."));
    }

    roots
        .into_iter()
        .flat_map(|root| {
            [
                root.join("target").join("release").join(worker),
                root.join("target").join("debug").join(worker),
                root.join("src-tauri").join("target").join("release").join(worker),
                root.join("artifacts").join("windows").join(worker),
                root.join("bin").join(worker),
                root.join(worker),
            ]
        })
        .find(|path| path.exists())
}

fn write_if_changed(destination: &Path, bytes: &[u8]) -> Result<()> {
    let fingerprint = fast_fingerprint(bytes);
    let fingerprint_path = destination.with_extension(format!(
        "{}.fingerprint",
        destination
            .extension()
            .and_then(|extension| extension.to_str())
            .unwrap_or("bin")
    ));
    if destination.exists() {
        let expected_len = bytes.len() as u64;
        let same_len = destination
            .metadata()
            .map(|metadata| metadata.len() == expected_len)
            .unwrap_or(false);
        let same_fingerprint = fs::read_to_string(&fingerprint_path)
            .map(|value| value == fingerprint)
            .unwrap_or(false);
        if same_len && same_fingerprint {
            return Ok(());
        }
    }
    fs::write(destination, bytes)?;
    fs::write(fingerprint_path, fingerprint)?;
    Ok(())
}

fn fast_fingerprint(bytes: &[u8]) -> String {
    let head_len = bytes.len().min(4096);
    let tail_len = bytes.len().saturating_sub(head_len).min(4096);
    let mut hash = 1469598103934665603u64;
    for byte in &bytes[..head_len] {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(1099511628211);
    }
    for byte in &bytes[bytes.len().saturating_sub(tail_len)..] {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(1099511628211);
    }
    format!("{}:{hash:016x}", bytes.len())
}
