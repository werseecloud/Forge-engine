use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDirectories {
    pub documents_root: String,
    pub projects_dir: String,
    pub templates_dir: String,
    pub backups_dir: String,
    pub local_root: String,
    pub cache_dir: String,
    pub logs_dir: String,
    pub shader_cache_dir: String,
    pub temp_dir: String,
    pub roaming_root: String,
    pub settings_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryNode {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub is_directory: bool,
    pub children: Vec<DirectoryNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatcherStatus {
    pub project_root: String,
    pub active: bool,
    pub mode: String,
}

