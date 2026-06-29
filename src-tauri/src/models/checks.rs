use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckResult {
    pub id: String,
    pub label: String,
    pub status: String,
    pub value: String,
    pub message: String,
    pub blocking: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPaths {
    pub install_default: String,
    pub documents_root: String,
    pub projects_dir: String,
    pub templates_dir: String,
    pub backups_dir: String,
    pub exports_dir: String,
    pub local_root: String,
    pub cache_dir: String,
    pub shader_cache_dir: String,
    pub asset_cache_dir: String,
    pub build_cache_dir: String,
    pub logs_dir: String,
    pub temp_dir: String,
    pub crash_reports_dir: String,
    pub worker_logs_dir: String,
    pub roaming_root: String,
    pub settings_path: String,
    pub installer_state_path: String,
}

