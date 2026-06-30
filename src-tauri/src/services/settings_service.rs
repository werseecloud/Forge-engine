use anyhow::Result;
use std::path::Path;

use crate::models::settings::AppSettings;
use crate::utils::paths::{ensure_app_directories, read_json, write_json_pretty};

pub fn default_settings() -> Result<AppSettings> {
    let dirs = ensure_app_directories()?;
    Ok(AppSettings {
        default_projects_dir: dirs.projects_dir,
        recent_projects: Vec::new(),
        pinned_projects: Vec::new(),
        theme: "forge-dark".to_string(),
        ui_scale: 1.0,
        last_opened_project: None,
        last_opened_level: None,
        content_browser_view_mode: "grid".to_string(),
        editor_layout: serde_json::json!({
            "leftDockWidth": 312,
            "rightDockWidth": 404,
            "bottomDrawerHeight": 318
        }),
        autosave_enabled: true,
        autosave_interval: 120,
        graphics_settings: forge_renderer::GraphicsSettings::default(),
    })
}

pub fn load_settings() -> Result<AppSettings> {
    let dirs = ensure_app_directories()?;
    let settings_path = Path::new(&dirs.settings_path);
    if settings_path.exists() {
        let mut settings: AppSettings = read_json(settings_path)?;
        if settings.default_projects_dir.trim().is_empty() {
            settings.default_projects_dir = dirs.projects_dir;
        }
        Ok(settings)
    } else {
        let settings = default_settings()?;
        save_settings(&settings)?;
        Ok(settings)
    }
}

pub fn save_settings(settings: &AppSettings) -> Result<AppSettings> {
    let dirs = ensure_app_directories()?;
    write_json_pretty(Path::new(&dirs.settings_path), settings)?;
    Ok(settings.clone())
}
