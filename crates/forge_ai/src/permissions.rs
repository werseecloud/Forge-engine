use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum PermissionMode {
    ReadOnly,
    Suggest,
    ApplyWithConfirmation,
    AutopilotProjectMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPermissionSet {
    pub mode: PermissionMode,
    pub allow_read_scene: bool,
    pub allow_edit_scene: bool,
    pub allow_edit_scripts: bool,
    pub allow_edit_blueprints: bool,
    pub allow_create_assets: bool,
    pub allow_project_analysis: bool,
    pub require_confirmation: bool,
    pub local_only: bool,
    pub cloud_enabled: bool,
}

impl Default for AiPermissionSet {
    fn default() -> Self {
        Self {
            mode: PermissionMode::Suggest,
            allow_read_scene: true,
            allow_edit_scene: false,
            allow_edit_scripts: false,
            allow_edit_blueprints: false,
            allow_create_assets: false,
            allow_project_analysis: true,
            require_confirmation: true,
            local_only: true,
            cloud_enabled: false,
        }
    }
}
