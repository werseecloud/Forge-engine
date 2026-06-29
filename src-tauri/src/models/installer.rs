use serde::{Deserialize, Serialize};
use crate::models::checks::CheckResult;
use crate::models::component::InstallerComponent;
use crate::models::health::HealthCheckResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExistingInstall {
    pub found: bool,
    pub install_path: String,
    pub installed_version: Option<String>,
    pub manifest_path: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathValidation {
    pub valid: bool,
    pub warning: Option<String>,
    pub message: String,
    pub available_space: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallConfig {
    pub install_mode: String,
    pub install_path: String,
    pub project_folder: String,
    pub selected_components: Vec<InstallerComponent>,
    pub create_desktop_shortcut: bool,
    pub create_start_menu_shortcut: bool,
    pub register_file_associations: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallPlan {
    pub install_path: String,
    pub project_folder: String,
    pub components: Vec<InstallerComponent>,
    pub total_size_bytes: u64,
    pub steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub success: bool,
    pub manifest_path: String,
    pub version_path: String,
    pub health_checks: Vec<HealthCheckResult>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallerState {
    pub current_step: usize,
    pub install_mode: String,
    pub install_path: String,
    pub project_folder: String,
    pub detected_existing_install: Option<ExistingInstall>,
    pub installed_version: Option<String>,
    pub available_version: String,
    pub selected_components: Vec<InstallerComponent>,
    pub system_checks: Vec<CheckResult>,
    pub health_checks: Vec<HealthCheckResult>,
    pub errors: Vec<String>,
    pub logs: Vec<String>,
}

