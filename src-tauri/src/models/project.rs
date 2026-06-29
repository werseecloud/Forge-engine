use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectManifest {
    pub project_id: String,
    pub project_name: String,
    pub description: String,
    pub engine_version: String,
    pub created_at: String,
    pub last_opened_at: String,
    pub root_path: String,
    pub default_scene: Option<String>,
    pub project_settings_path: String,
    pub content_root: String,
    pub asset_index_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub project_id: String,
    pub project_name: String,
    pub root_path: String,
    pub manifest_path: String,
    pub last_opened_at: String,
    pub pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    pub project_name: String,
    pub location: String,
    pub description: String,
    pub template: String,
    pub render_backend: String,
    pub target_platform: String,
    pub starter_content: bool,
    pub source_control_ignore: bool,
    pub create_default_scene: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenProjectResponse {
    pub manifest: ProjectManifest,
    pub levels: Vec<crate::models::scene::LevelSummary>,
    pub asset_index: crate::models::asset::AssetIndex,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectValidation {
    pub valid: bool,
    pub manifest_path: Option<String>,
    pub message: String,
}

