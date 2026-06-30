use crate::utils::embedded_skyboxes::{self, SkyboxManifest};
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn get_embedded_skybox_manifest() -> CommandResult<SkyboxManifest> {
    embedded_skyboxes::ensure_embedded_skyboxes_installed().map_err(command_error)
}
