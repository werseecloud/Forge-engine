use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::models::component::InstallerComponent;

const REQUIRED: &[(&str, &str, &str)] = &[
    ("forge_editor_core", "Forge Editor Core", "forge_editor_core.exe"),
    ("forge_runtime", "Forge Runtime", "forge_runtime.exe"),
    ("forge_renderer_worker", "Forge Renderer Worker", "forge_renderer_worker.exe"),
    ("forge_shader_worker", "Forge Shader Worker", "forge_shader_worker.exe"),
    ("forge_asset_worker", "Forge Asset Worker", "forge_asset_worker.exe"),
    ("forge_build_worker", "Forge Build Worker", "forge_build_worker.exe"),
];

pub fn scan_available_components(install_path: String) -> Result<Vec<InstallerComponent>> {
    let repo = find_repo_root()?;
    let mut items = Vec::new();
    for (id, display, binary) in REQUIRED {
        let source = find_binary(&repo, id, binary);
        let size = source.as_ref().map(|p| file_size(p)).unwrap_or(0);
        items.push(InstallerComponent {
            id: id.to_string(),
            display_name: display.to_string(),
            binary_name: binary.to_string(),
            required: true,
            optional: false,
            selected: true,
            available: source.is_some(),
            size_bytes: size,
            source_path: source.as_ref().map(|p| p.to_string_lossy().to_string()),
            destination_path: Path::new(&install_path).join("bin").join(binary).to_string_lossy().to_string(),
            error: if source.is_some() { None } else { Some(format!("Required component {} was not found. Build the component before running the installer.", binary)) },
        });
    }
    for (id, display, source_dir, destination) in [
        ("forge_templates", "Forge Templates", repo.join("engine\\Templates"), Path::new(&install_path).join("engine\\Templates")),
        ("forge_starter_content", "Forge Starter Content", repo.join("engine\\StarterContent"), Path::new(&install_path).join("engine\\StarterContent")),
        ("forge_shader_library", "Forge Shader Library", repo.join("engine\\Shaders"), Path::new(&install_path).join("engine\\Shaders")),
        ("forge_runtime_files", "Forge Runtime Files", repo.join("engine\\Runtime"), Path::new(&install_path).join("engine\\Runtime")),
        ("forge_docs", "Forge Documentation", repo.join("docs"), Path::new(&install_path).join("docs")),
        ("forge_licenses", "Forge Licenses", repo.join("licenses"), Path::new(&install_path).join("licenses")),
    ] {
        let exists = source_dir.exists();
        items.push(InstallerComponent {
            id: id.to_string(),
            display_name: display.to_string(),
            binary_name: String::new(),
            required: false,
            optional: true,
            selected: exists,
            available: exists,
            size_bytes: if exists { folder_size(&source_dir).unwrap_or(0) } else { 0 },
            source_path: if exists { Some(source_dir.to_string_lossy().to_string()) } else { None },
            destination_path: destination.to_string_lossy().to_string(),
            error: if exists { None } else { Some(format!("Optional local content folder was not found: {}", source_dir.display())) },
        });
    }
    for (id, display) in [
        ("file_associations", "Forge File Associations"),
        ("desktop_shortcut", "Desktop Shortcut"),
        ("start_menu_shortcut", "Start Menu Shortcut"),
    ] {
        items.push(InstallerComponent {
            id: id.to_string(),
            display_name: display.to_string(),
            binary_name: String::new(),
            required: false,
            optional: true,
            selected: true,
            available: true,
            size_bytes: 0,
            source_path: None,
            destination_path: install_path.clone(),
            error: None,
        });
    }
    Ok(items)
}

fn find_repo_root() -> Result<PathBuf> {
    let mut starts = vec![std::env::current_dir()?];
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            starts.push(parent.to_path_buf());
        }
    }
    for start in starts {
        for ancestor in start.ancestors() {
            if ancestor.join("apps").exists() {
                return Ok(ancestor.to_path_buf());
            }
        }
    }
    Ok(std::env::current_dir()?)
}

pub fn calculate_component_size(component_id: String) -> Result<u64> {
    let install = crate::services::installer_system_service::get_windows_user_paths()?.install_default;
    Ok(scan_available_components(install)?.into_iter().find(|c| c.id == component_id).map(|c| c.size_bytes).unwrap_or(0))
}

pub fn validate_component_sources(install_path: String) -> Result<Vec<InstallerComponent>> {
    scan_available_components(install_path)
}

fn find_binary(repo: &Path, id: &str, binary: &str) -> Option<PathBuf> {
    let candidates = [
        repo.join("target\\release").join(binary),
        repo.join("target\\debug").join(binary),
        repo.join("apps").join(id).join("target\\release").join(binary),
        repo.join("apps").join(id).join("target\\debug").join(binary),
        repo.join("apps").join(id).join("dist").join(binary),
        repo.join("apps").join(id).join("src-tauri\\target\\release").join(binary),
    ];
    candidates.into_iter().find(|p| p.exists())
}

pub fn file_size(path: &Path) -> u64 {
    fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

pub fn folder_size(path: &Path) -> Result<u64> {
    if !path.exists() {
        return Ok(0);
    }
    Ok(WalkDir::new(path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.path().is_file())
        .map(|e| file_size(e.path()))
        .sum())
}
