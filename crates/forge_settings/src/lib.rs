use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeUserPaths {
    pub documents_root: PathBuf,
    pub projects_dir: PathBuf,
    pub local_root: PathBuf,
    pub logs_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub shader_cache_dir: PathBuf,
    pub asset_cache_dir: PathBuf,
    pub build_cache_dir: PathBuf,
    pub roaming_root: PathBuf,
    pub settings_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerPorts {
    pub asset: u16,
    pub shader: u16,
    pub renderer: u16,
    pub runtime: u16,
    pub build: u16,
}

impl Default for WorkerPorts {
    fn default() -> Self {
        Self { asset: 39210, shader: 39211, renderer: 39212, runtime: 39213, build: 39214 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeSettings {
    pub default_projects_dir: PathBuf,
    pub warm_workers_on_startup: bool,
    pub worker_ports: WorkerPorts,
}

pub fn resolve_user_paths() -> Result<ForgeUserPaths> {
    let documents_root = dirs::document_dir()
        .ok_or_else(|| anyhow::anyhow!("Documents directory was not found"))?
        .join("Forge Engine");
    let local_root = dirs::data_local_dir()
        .ok_or_else(|| anyhow::anyhow!("LocalAppData was not found"))?
        .join("ForgeEngine");
    let roaming_root = dirs::config_dir()
        .ok_or_else(|| anyhow::anyhow!("Roaming AppData was not found"))?
        .join("ForgeEngine");
    Ok(ForgeUserPaths {
        projects_dir: documents_root.join("Projects"),
        documents_root,
        logs_dir: local_root.join("Logs"),
        cache_dir: local_root.join("Cache"),
        shader_cache_dir: local_root.join("ShaderCache"),
        asset_cache_dir: local_root.join("AssetCache"),
        build_cache_dir: local_root.join("BuildCache"),
        local_root,
        settings_path: roaming_root.join("settings.json"),
        roaming_root,
    })
}

pub fn ensure_user_paths() -> Result<ForgeUserPaths> {
    let paths = resolve_user_paths()?;
    for path in [
        &paths.documents_root,
        &paths.projects_dir,
        &paths.local_root,
        &paths.logs_dir,
        &paths.cache_dir,
        &paths.shader_cache_dir,
        &paths.asset_cache_dir,
        &paths.build_cache_dir,
        &paths.roaming_root,
    ] {
        fs::create_dir_all(path)?;
    }
    Ok(paths)
}

pub fn default_settings() -> Result<ForgeSettings> {
    let paths = ensure_user_paths()?;
    Ok(ForgeSettings {
        default_projects_dir: paths.projects_dir,
        warm_workers_on_startup: false,
        worker_ports: WorkerPorts::default(),
    })
}
