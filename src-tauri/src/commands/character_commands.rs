use crate::models::character::{
    AnimationDatabase, AnimationSelectionInput, AnimationSelectionResult, CharacterImportRequest,
    CharacterImportResult, CharacterRuntimePlan, DefaultCharacterAssets,
    GeneratedAnimationStateMachine, HumanoidDetectionResult,
};
use crate::services::character_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn detect_humanoid(character_source_path: String) -> CommandResult<HumanoidDetectionResult> {
    character_service::detect_humanoid(character_source_path).map_err(command_error)
}

#[tauri::command]
pub fn discover_default_character_assets() -> CommandResult<DefaultCharacterAssets> {
    character_service::discover_default_character_assets().map_err(command_error)
}

#[tauri::command]
pub fn index_animation_packs(
    animation_pack_paths: Vec<String>,
) -> CommandResult<AnimationDatabase> {
    character_service::index_animation_packs(animation_pack_paths).map_err(command_error)
}

#[tauri::command]
pub fn import_character(request: CharacterImportRequest) -> CommandResult<CharacterImportResult> {
    character_service::import_character(request).map_err(command_error)
}

#[tauri::command]
pub fn build_character_runtime_plan(
    project_root: String,
    character_manifest_path: String,
) -> CommandResult<CharacterRuntimePlan> {
    character_service::build_character_runtime_plan(project_root, character_manifest_path)
        .map_err(command_error)
}

#[tauri::command]
pub fn select_procedural_animation(
    input: AnimationSelectionInput,
) -> CommandResult<AnimationSelectionResult> {
    character_service::select_procedural_animation(input).map_err(command_error)
}

#[tauri::command]
pub fn generate_animation_state_machine(
    animation_database_path: String,
) -> CommandResult<GeneratedAnimationStateMachine> {
    character_service::generate_animation_state_machine(animation_database_path)
        .map_err(command_error)
}
