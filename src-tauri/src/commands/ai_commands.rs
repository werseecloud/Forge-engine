use crate::services::ai_service;
use crate::utils::errors::{command_error, CommandResult};
use forge_ai::{
    AiCompatibilityReport, AiContext, AiContextRequest, AiGenerationResult, AiPermissionSet,
    AiPrompt, AiProposedAction, AiToolDescriptor, GenerateOptions, HardwareProfile, InstalledModel,
    ModelStatus, RuntimeModelHandle,
};

#[tauri::command]
pub fn ai_probe_device() -> CommandResult<AiCompatibilityReport> {
    ai_service::probe_device().map_err(command_error)
}

#[tauri::command]
pub fn ai_get_device_profile() -> CommandResult<HardwareProfile> {
    ai_service::get_device_profile().map_err(command_error)
}

#[tauri::command]
pub fn ai_list_installed_models() -> CommandResult<Vec<InstalledModel>> {
    ai_service::list_installed_models().map_err(command_error)
}

#[tauri::command]
pub fn ai_import_model(path: String) -> CommandResult<InstalledModel> {
    ai_service::import_model(path).map_err(command_error)
}

#[tauri::command]
pub fn ai_validate_model(model_id: String) -> CommandResult<ModelStatus> {
    ai_service::validate_model(model_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_select_model(model_id: String) -> CommandResult<InstalledModel> {
    ai_service::select_model(model_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_load_model(model_id: String) -> CommandResult<RuntimeModelHandle> {
    ai_service::load_model(model_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_unload_model(model_id: String) -> CommandResult<()> {
    ai_service::unload_model(model_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_get_model_status(model_id: String) -> CommandResult<ModelStatus> {
    ai_service::get_model_status(model_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_get_recommended_models() -> CommandResult<AiCompatibilityReport> {
    ai_service::get_recommended_models().map_err(command_error)
}

#[tauri::command]
pub fn ai_generate(
    prompt: AiPrompt,
    options: GenerateOptions,
) -> CommandResult<AiGenerationResult> {
    ai_service::generate(prompt, options).map_err(command_error)
}

#[tauri::command]
pub fn ai_cancel_generation(job_id: String) -> CommandResult<()> {
    ai_service::cancel_generation(job_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_build_context(request: AiContextRequest) -> CommandResult<AiContext> {
    ai_service::build_ai_context(request).map_err(command_error)
}

#[tauri::command]
pub fn ai_get_available_tools() -> CommandResult<Vec<AiToolDescriptor>> {
    ai_service::get_available_tools().map_err(command_error)
}

#[tauri::command]
pub fn ai_propose_actions(
    user_prompt: String,
    context: AiContext,
) -> CommandResult<Vec<AiProposedAction>> {
    ai_service::propose_actions(user_prompt, context).map_err(command_error)
}

#[tauri::command]
pub fn ai_apply_action(action_id: String) -> CommandResult<AiProposedAction> {
    ai_service::apply_action(action_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_reject_action(action_id: String) -> CommandResult<()> {
    ai_service::reject_action(action_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_preview_action(action_id: String) -> CommandResult<AiProposedAction> {
    ai_service::preview_action(action_id).map_err(command_error)
}

#[tauri::command]
pub fn ai_get_permissions() -> CommandResult<AiPermissionSet> {
    ai_service::get_permissions().map_err(command_error)
}

#[tauri::command]
pub fn ai_set_permissions(permissions: AiPermissionSet) -> CommandResult<AiPermissionSet> {
    ai_service::set_permissions(permissions).map_err(command_error)
}

#[tauri::command]
pub fn ai_enable_offline_mode(value: bool) -> CommandResult<AiPermissionSet> {
    ai_service::enable_offline_mode(value).map_err(command_error)
}

#[tauri::command]
pub fn ai_get_logs() -> CommandResult<Vec<String>> {
    ai_service::get_logs().map_err(command_error)
}

#[tauri::command]
pub fn ai_clear_logs() -> CommandResult<()> {
    ai_service::clear_logs().map_err(command_error)
}
