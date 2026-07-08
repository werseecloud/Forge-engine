use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiContextRequest {
    pub project_root: Option<String>,
    pub selected_entity_json: Option<String>,
    pub active_level_json: Option<String>,
    pub active_file_path: Option<String>,
    pub diagnostics: Vec<String>,
    pub user_intent: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiContext {
    pub summary: String,
    pub selected_entity: Option<String>,
    pub active_level: Option<String>,
    pub active_file: Option<String>,
    pub diagnostics: Vec<String>,
    pub allowed_tools: Vec<String>,
}

pub fn build_context(request: AiContextRequest) -> AiContext {
    let mut parts = Vec::new();
    if let Some(root) = &request.project_root {
        parts.push(format!("Project: {root}"));
    }
    if request.selected_entity_json.is_some() {
        parts.push("Selected entity is available.".to_string());
    }
    if request.active_level_json.is_some() {
        parts.push("Active level context is available.".to_string());
    }
    if !request.diagnostics.is_empty() {
        parts.push(format!("Diagnostics: {}", request.diagnostics.len()));
    }
    if let Some(intent) = &request.user_intent {
        parts.push(format!("User intent: {intent}"));
    }
    AiContext {
        summary: parts.join("\n"),
        selected_entity: request.selected_entity_json,
        active_level: request.active_level_json,
        active_file: request.active_file_path,
        diagnostics: request.diagnostics,
        allowed_tools: vec![
            "get_selected_entity".to_string(),
            "list_scene_entities".to_string(),
            "set_inspector_value".to_string(),
            "create_blueprint_node".to_string(),
            "suggest_script_fix".to_string(),
            "update_world_setting".to_string(),
            "create_playable_character".to_string(),
        ],
    }
}
