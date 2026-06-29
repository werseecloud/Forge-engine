use anyhow::{anyhow, Result};
use chrono::Utc;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::asset::AssetIndex;
use crate::models::project::{
    CreateProjectRequest, OpenProjectResponse, ProjectManifest, ProjectSummary, ProjectValidation,
};
use crate::models::settings::AppSettings;
use crate::services::{asset_service, log_service, scene_service, settings_service};
use crate::utils::ids::new_id;
use crate::utils::paths::{
    read_json, sanitize_file_stem, sanitize_name, write_json_pretty, ENGINE_VERSION,
};

const PROJECT_FILE: &str = "ForgeProject.forge";

pub fn create_project(request: CreateProjectRequest) -> Result<OpenProjectResponse> {
    let project_name = sanitize_name(&request.project_name);
    let project_folder = sanitize_file_stem(&project_name);
    let root = Path::new(&request.location).join(project_folder);
    if root.exists() && root.read_dir()?.next().is_some() {
        return Err(anyhow!("Project folder already exists and is not empty: {}", root.display()));
    }

    create_project_folders(&root)?;

    let now = Utc::now().to_rfc3339();
    let project_id = new_id("project");
    let default_scene = if request.create_default_scene {
        let created = scene_service::create_level_at_root(&root, "Main")?;
        Some(created.relative_path)
    } else {
        None
    };

    let manifest = ProjectManifest {
        project_id,
        project_name: project_name.clone(),
        description: request.description,
        engine_version: ENGINE_VERSION.to_string(),
        created_at: now.clone(),
        last_opened_at: now.clone(),
        root_path: root.to_string_lossy().to_string(),
        default_scene,
        project_settings_path: "Config/project.json".to_string(),
        content_root: "Content".to_string(),
        asset_index_path: ".forge/asset_index.json".to_string(),
    };

    write_json_pretty(&root.join(PROJECT_FILE), &manifest)?;
    write_json_pretty(
        &root.join("Config/project.json"),
        &serde_json::json!({
            "projectName": project_name,
            "template": request.template,
            "engineVersion": ENGINE_VERSION,
            "createdAt": now
        }),
    )?;
    write_json_pretty(
        &root.join("Config/input.json"),
        &serde_json::json!({
            "actions": [],
            "bindings": []
        }),
    )?;
    write_json_pretty(
        &root.join("Config/rendering.json"),
        &serde_json::json!({
            "backend": request.render_backend,
            "targetPlatform": request.target_platform,
            "hdr": true,
            "gridInEditor": true
        }),
    )?;
    write_json_pretty(
        &root.join("Config/editor.json"),
        &serde_json::json!({
            "autosave": true,
            "autosaveIntervalSeconds": 120
        }),
    )?;
    write_json_pretty(
        &root.join(".forge/project_state.json"),
        &serde_json::json!({
            "openedAt": now,
            "activeLevel": manifest.default_scene
        }),
    )?;
    write_json_pretty(&root.join(".forge/editor_layout.json"), &serde_json::json!({}))?;
    write_json_pretty(
        &root.join(".forge/recent_selections.json"),
        &serde_json::json!({
            "selectedAsset": null,
            "selectedSceneObject": null
        }),
    )?;

    if request.source_control_ignore {
        fs::write(
            root.join(".gitignore"),
            "Build/\nCache/\nSaved/Autosaves/\nSaved/Backups/\nSaved/Logs/\n.forge/editor_layout.json\n",
        )?;
    }

    let index = AssetIndex {
        project_root: root.to_string_lossy().to_string(),
        rebuilt_at: Utc::now().to_rfc3339(),
        assets: Vec::new(),
    };
    write_json_pretty(&root.join(".forge/asset_index.json"), &index)?;

    let response = open_project(root.to_string_lossy().to_string())?;
    log_service::append_output_log(&format!(
        "Created project '{}' at {}",
        manifest.project_name,
        root.display()
    ))?;
    Ok(response)
}

pub fn open_project(path: String) -> Result<OpenProjectResponse> {
    let manifest_path = resolve_manifest_path(&path)?;
    let mut manifest: ProjectManifest = read_json(&manifest_path)?;
    manifest.last_opened_at = Utc::now().to_rfc3339();
    write_json_pretty(&manifest_path, &manifest)?;

    let mut settings = settings_service::load_settings()?;
    settings.last_opened_project = Some(manifest.root_path.clone());
    upsert_recent_project(&mut settings, project_summary(&manifest, false));
    settings_service::save_settings(&settings)?;

    let index = asset_service::rebuild_asset_index(manifest.root_path.clone())?;
    let levels = scene_service::list_levels(manifest.root_path.clone())?;
    log_service::append_output_log(&format!("Opened project '{}'", manifest.project_name))?;

    Ok(OpenProjectResponse {
        manifest,
        levels,
        asset_index: index,
    })
}

pub fn close_project() -> Result<()> {
    let mut settings = settings_service::load_settings()?;
    settings.last_opened_project = None;
    settings.last_opened_level = None;
    settings_service::save_settings(&settings)?;
    log_service::append_output_log("Closed current project")?;
    Ok(())
}

pub fn list_recent_projects() -> Result<Vec<ProjectSummary>> {
    Ok(settings_service::load_settings()?.recent_projects)
}

pub fn pin_project(root_path: String) -> Result<Vec<ProjectSummary>> {
    let mut settings = settings_service::load_settings()?;
    if !settings.pinned_projects.iter().any(|path| path == &root_path) {
        settings.pinned_projects.push(root_path.clone());
    }
    for recent in &mut settings.recent_projects {
        if recent.root_path == root_path {
            recent.pinned = true;
        }
    }
    settings_service::save_settings(&settings)?;
    Ok(settings.recent_projects)
}

pub fn unpin_project(root_path: String) -> Result<Vec<ProjectSummary>> {
    let mut settings = settings_service::load_settings()?;
    settings.pinned_projects.retain(|path| path != &root_path);
    for recent in &mut settings.recent_projects {
        if recent.root_path == root_path {
            recent.pinned = false;
        }
    }
    settings_service::save_settings(&settings)?;
    Ok(settings.recent_projects)
}

pub fn validate_project_path(path: String) -> ProjectValidation {
    match resolve_manifest_path(&path) {
        Ok(manifest) => ProjectValidation {
            valid: true,
            manifest_path: Some(manifest.to_string_lossy().to_string()),
            message: "Forge project manifest found".to_string(),
        },
        Err(error) => ProjectValidation {
            valid: false,
            manifest_path: None,
            message: error.to_string(),
        },
    }
}

pub fn repair_project_path(path: String) -> Result<OpenProjectResponse> {
    let manifest_path = resolve_manifest_path(&path)?;
    let manifest: ProjectManifest = read_json(&manifest_path)?;
    create_project_folders(Path::new(&manifest.root_path))?;
    if !Path::new(&manifest.root_path).join(".forge/asset_index.json").exists() {
        asset_service::rebuild_asset_index(manifest.root_path.clone())?;
    }
    open_project(manifest.root_path)
}

fn create_project_folders(root: &Path) -> Result<()> {
    for folder in [
        ".forge",
        "Config",
        "Content/Scenes",
        "Content/Levels",
        "Content/Blueprints",
        "Content/Materials",
        "Content/Meshes",
        "Content/Textures",
        "Content/Audio",
        "Content/Animations",
        "Content/UI",
        "Content/VFX",
        "Content/Data",
        "Source",
        "Plugins",
        "Build",
        "Cache",
        "Saved/Autosaves",
        "Saved/Backups",
        "Saved/Logs",
        "Screenshots",
    ] {
        fs::create_dir_all(root.join(folder))?;
    }
    Ok(())
}

fn resolve_manifest_path(path: &str) -> Result<PathBuf> {
    let input = PathBuf::from(path);
    let manifest = if input.is_file() {
        input
    } else {
        input.join(PROJECT_FILE)
    };

    if manifest.exists() {
        Ok(manifest)
    } else {
        Err(anyhow!("ForgeProject.forge was not found at {}", manifest.display()))
    }
}

fn project_summary(manifest: &ProjectManifest, pinned: bool) -> ProjectSummary {
    ProjectSummary {
        project_id: manifest.project_id.clone(),
        project_name: manifest.project_name.clone(),
        root_path: manifest.root_path.clone(),
        manifest_path: Path::new(&manifest.root_path)
            .join(PROJECT_FILE)
            .to_string_lossy()
            .to_string(),
        last_opened_at: manifest.last_opened_at.clone(),
        pinned,
    }
}

fn upsert_recent_project(settings: &mut AppSettings, mut summary: ProjectSummary) {
    summary.pinned = settings
        .pinned_projects
        .iter()
        .any(|path| path == &summary.root_path);
    settings
        .recent_projects
        .retain(|project| project.root_path != summary.root_path);
    settings.recent_projects.insert(0, summary);
    settings.recent_projects.truncate(20);
}

