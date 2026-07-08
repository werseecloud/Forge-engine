use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiContextRequest {
    pub project_root: Option<String>,
    pub selected_entity_json: Option<String>,
    pub active_level_json: Option<String>,
    pub asset_index_json: Option<String>,
    pub active_blueprint_graph_json: Option<String>,
    pub active_file_path: Option<String>,
    pub diagnostics: Vec<String>,
    pub user_intent: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiContext {
    pub summary: String,
    pub project_root: Option<String>,
    pub selected_entity: Option<String>,
    pub active_level: Option<String>,
    pub active_level_path: Option<String>,
    pub asset_index: Option<String>,
    pub active_blueprint_graph: Option<String>,
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
    if let Some(level) = summarize_level(request.active_level_json.as_deref()) {
        parts.push(level);
    }
    if let Some(assets) = summarize_assets(request.asset_index_json.as_deref()) {
        parts.push(assets);
    }
    if let Some(graph) = summarize_blueprint(request.active_blueprint_graph_json.as_deref()) {
        parts.push(graph);
    }
    if !request.diagnostics.is_empty() {
        parts.push(format!(
            "Diagnostics: {}\n{}",
            request.diagnostics.len(),
            request
                .diagnostics
                .iter()
                .take(20)
                .map(|item| format!("- {item}"))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    if let Some(intent) = &request.user_intent {
        parts.push(format!("User intent: {intent}"));
    }
    let active_level_path = request
        .active_level_json
        .as_deref()
        .and_then(|json| serde_json::from_str::<serde_json::Value>(json).ok())
        .and_then(|value| {
            value
                .get("path")
                .and_then(|path| path.as_str())
                .map(str::to_string)
        });
    AiContext {
        summary: clamp_summary(&parts.join("\n\n"), 24_000),
        project_root: request.project_root,
        selected_entity: request.selected_entity_json,
        active_level: request.active_level_json,
        active_level_path,
        asset_index: request.asset_index_json,
        active_blueprint_graph: request.active_blueprint_graph_json,
        active_file: request.active_file_path,
        diagnostics: request.diagnostics,
        allowed_tools: vec![
            "get_selected_entity".to_string(),
            "list_scene_entities".to_string(),
            "set_inspector_value".to_string(),
            "create_blueprint_graph".to_string(),
            "create_blueprint_node".to_string(),
            "suggest_script_fix".to_string(),
            "update_world_setting".to_string(),
            "create_playable_character".to_string(),
        ],
    }
}

fn summarize_level(json: Option<&str>) -> Option<String> {
    let value = serde_json::from_str::<serde_json::Value>(json?).ok()?;
    let name = value
        .get("name")
        .and_then(|item| item.as_str())
        .unwrap_or("Unnamed");
    let path = value
        .get("path")
        .and_then(|item| item.as_str())
        .unwrap_or("unknown");
    let layers = value
        .get("layers")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let objects = value
        .get("objects")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let mut lines = vec![
        format!("Scene: {name}"),
        format!("Scene path: {path}"),
        format!("Layers: {}", layers.len()),
        format!("Scene objects: {}", objects.len()),
    ];
    for layer in layers.iter().take(32) {
        lines.push(format!(
            "- Layer {} visible={} color={}",
            layer
                .get("name")
                .and_then(|item| item.as_str())
                .unwrap_or("Unnamed"),
            layer
                .get("visible")
                .and_then(|item| item.as_bool())
                .unwrap_or(true),
            layer
                .get("color")
                .and_then(|item| item.as_str())
                .unwrap_or("")
        ));
    }
    lines.push("Objects:".to_string());
    for object in objects.iter().take(256) {
        let components = object
            .get("components")
            .and_then(|item| item.as_array())
            .map(|items| {
                items
                    .iter()
                    .filter_map(|component| {
                        component
                            .get("componentType")
                            .and_then(|item| item.as_str())
                            .map(str::to_string)
                    })
                    .collect::<Vec<_>>()
                    .join(", ")
            })
            .unwrap_or_default();
        let tags = object
            .get("tags")
            .and_then(|item| item.as_array())
            .map(|items| {
                items
                    .iter()
                    .filter_map(|tag| tag.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            })
            .unwrap_or_default();
        let transform = object
            .get("transform")
            .cloned()
            .unwrap_or(serde_json::Value::Null);
        lines.push(format!(
            "- id={} name={} visible={} asset={} tags=[{}] components=[{}] transform={}",
            object
                .get("id")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            object
                .get("name")
                .and_then(|item| item.as_str())
                .unwrap_or("Unnamed"),
            object
                .get("visible")
                .and_then(|item| item.as_bool())
                .unwrap_or(true),
            object
                .get("assetReference")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            tags,
            components,
            clamp_summary(&transform.to_string(), 420)
        ));
    }
    if objects.len() > 256 {
        lines.push(format!(
            "- {} more objects omitted from summary but full JSON is available to tools.",
            objects.len() - 256
        ));
    }
    Some(lines.join("\n"))
}

fn summarize_assets(json: Option<&str>) -> Option<String> {
    let value = serde_json::from_str::<serde_json::Value>(json?).ok()?;
    let assets = value
        .get("assets")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    for asset in &assets {
        let kind = asset
            .get("assetType")
            .and_then(|item| item.as_str())
            .unwrap_or("Unknown")
            .to_string();
        *counts.entry(kind).or_default() += 1;
    }
    let mut lines = vec![format!("Assets indexed: {}", assets.len())];
    for (kind, count) in counts {
        lines.push(format!("- {kind}: {count}"));
    }
    for asset in assets.iter().take(80) {
        lines.push(format!(
            "- {} [{}] {}",
            asset
                .get("fileName")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            asset
                .get("assetType")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            asset
                .get("relativePath")
                .and_then(|item| item.as_str())
                .unwrap_or("")
        ));
    }
    Some(lines.join("\n"))
}

fn summarize_blueprint(json: Option<&str>) -> Option<String> {
    let value = serde_json::from_str::<serde_json::Value>(json?).ok()?;
    let nodes = value
        .get("nodes")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let edges = value
        .get("edges")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let variables = value
        .get("variables")
        .and_then(|item| item.as_array())
        .cloned()
        .unwrap_or_default();
    let mut lines = vec![
        format!(
            "Active Blueprint: {} ({})",
            value
                .get("name")
                .and_then(|item| item.as_str())
                .unwrap_or("Unnamed"),
            value
                .get("graphType")
                .and_then(|item| item.as_str())
                .unwrap_or("Blueprint")
        ),
        format!(
            "Blueprint nodes={} edges={} variables={}",
            nodes.len(),
            edges.len(),
            variables.len()
        ),
    ];
    for node in nodes.iter().take(120) {
        lines.push(format!(
            "- node id={} type={} title={} category={}",
            node.get("id").and_then(|item| item.as_str()).unwrap_or(""),
            node.get("type")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            node.get("title")
                .and_then(|item| item.as_str())
                .unwrap_or(""),
            node.get("category")
                .and_then(|item| item.as_str())
                .unwrap_or("")
        ));
    }
    Some(lines.join("\n"))
}

fn clamp_summary(value: &str, max_chars: usize) -> String {
    if value.chars().count() <= max_chars {
        return value.to_string();
    }
    let mut output = value.chars().take(max_chars).collect::<String>();
    output.push_str("\n[context truncated]");
    output
}
