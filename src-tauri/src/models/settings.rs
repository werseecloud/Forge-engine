use serde::{Deserialize, Serialize};

use crate::models::project::ProjectSummary;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub default_projects_dir: String,
    pub recent_projects: Vec<ProjectSummary>,
    pub pinned_projects: Vec<String>,
    pub theme: String,
    pub ui_scale: f32,
    pub last_opened_project: Option<String>,
    pub last_opened_level: Option<String>,
    pub content_browser_view_mode: String,
    pub editor_layout: serde_json::Value,
    pub autosave_enabled: bool,
    pub autosave_interval: u32,
}

