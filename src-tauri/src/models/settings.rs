use serde::{Deserialize, Serialize};

use crate::models::project::ProjectSummary;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub default_projects_dir: String,
    #[serde(default)]
    pub recent_projects: Vec<ProjectSummary>,
    #[serde(default)]
    pub pinned_projects: Vec<String>,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_ui_scale")]
    pub ui_scale: f32,
    #[serde(default)]
    pub last_opened_project: Option<String>,
    #[serde(default)]
    pub last_opened_level: Option<String>,
    #[serde(default = "default_content_browser_view_mode")]
    pub content_browser_view_mode: String,
    #[serde(default = "default_editor_layout")]
    pub editor_layout: serde_json::Value,
    #[serde(default = "default_autosave_enabled")]
    pub autosave_enabled: bool,
    #[serde(default = "default_autosave_interval")]
    pub autosave_interval: u32,
    #[serde(default)]
    pub graphics_settings: forge_renderer::GraphicsSettings,
}

fn default_theme() -> String {
    "forge-dark".to_string()
}

fn default_ui_scale() -> f32 {
    1.0
}

fn default_content_browser_view_mode() -> String {
    "grid".to_string()
}

fn default_editor_layout() -> serde_json::Value {
    serde_json::json!({
        "leftDockWidth": 312,
        "rightDockWidth": 404,
        "bottomDrawerHeight": 318
    })
}

fn default_autosave_enabled() -> bool {
    true
}

fn default_autosave_interval() -> u32 {
    120
}
