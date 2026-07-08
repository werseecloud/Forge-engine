use crate::context::AiContext;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiToolDescriptor {
    pub name: String,
    pub category: String,
    pub description: String,
    pub destructive: bool,
    pub requires_confirmation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProposedAction {
    pub action_id: String,
    pub title: String,
    pub description: String,
    pub target: String,
    pub before: Option<String>,
    pub after: Option<String>,
    pub risk: String,
    pub requires_confirmation: bool,
    pub tool_name: String,
    pub operation: String,
    pub payload: Value,
    pub project_root: Option<String>,
    pub level_path: Option<String>,
    pub applied: bool,
    pub result: Option<String>,
}

#[derive(Default)]
pub struct AiToolRouter;

impl AiToolRouter {
    pub fn tools() -> Vec<AiToolDescriptor> {
        vec![
            tool(
                "get_selected_entity",
                "Scene",
                "Read selected scene entity.",
                false,
            ),
            tool(
                "update_transform",
                "Scene",
                "Move, rotate or scale a selected object.",
                false,
            ),
            tool("delete_entity", "Scene", "Delete a scene entity.", true),
            tool(
                "update_world_setting",
                "World",
                "Change world generation settings.",
                false,
            ),
            tool(
                "create_blueprint_node",
                "Blueprints",
                "Create a Blueprint node proposal.",
                false,
            ),
            tool(
                "suggest_script_fix",
                "Forge Script",
                "Suggest a Forge Script patch.",
                false,
            ),
            tool(
                "create_playable_character",
                "Characters",
                "Create playable character component proposal.",
                false,
            ),
            tool(
                "optimize_project",
                "Project",
                "Suggest project optimization actions.",
                false,
            ),
        ]
    }

    pub fn propose_actions(user_prompt: &str, context: &AiContext) -> Vec<AiProposedAction> {
        let lower = user_prompt.to_lowercase();
        let mut actions = Vec::new();

        if lower.contains("bigger") || lower.contains("groter") || lower.contains("scale") {
            if let Some(object) = selected_object_payload(context, |object| {
                let transform = ensure_transform(object);
                transform["scale"] = json!({ "x": 1.25, "y": 1.25, "z": 1.25 });
            }) {
                actions.push(action(
                    context,
                    "Scale selected object",
                    "Set selected object scale to 1.25 on all axes.",
                    "SelectedEntity.Transform.Scale",
                    context.selected_entity.clone(),
                    Some("scale = 1.25, 1.25, 1.25"),
                    "low",
                    "update_transform",
                    "update_scene_object",
                    json!({ "object": object }),
                ));
            }
        }
        if lower.contains("left")
            || lower.contains("links")
            || lower.contains("right")
            || lower.contains("rechts")
            || lower.contains("up")
            || lower.contains("omhoog")
            || lower.contains("down")
            || lower.contains("omlaag")
            || lower.contains("forward")
            || lower.contains("vooruit")
            || lower.contains("back")
            || lower.contains("achter")
        {
            if let Some(object) = selected_object_payload(context, |object| {
                let transform = ensure_transform(object);
                let mut position = transform
                    .get("position")
                    .cloned()
                    .unwrap_or_else(|| json!({ "x": 0.0, "y": 0.0, "z": 0.0 }));
                let delta = if lower.contains("left") || lower.contains("links") {
                    (-100.0, 0.0, 0.0)
                } else if lower.contains("right") || lower.contains("rechts") {
                    (100.0, 0.0, 0.0)
                } else if lower.contains("up") || lower.contains("omhoog") {
                    (0.0, 100.0, 0.0)
                } else if lower.contains("down") || lower.contains("omlaag") {
                    (0.0, -100.0, 0.0)
                } else if lower.contains("back") || lower.contains("achter") {
                    (0.0, 0.0, -100.0)
                } else {
                    (0.0, 0.0, 100.0)
                };
                add_vec3(&mut position, delta);
                transform["position"] = position;
            }) {
                actions.push(action(
                    context,
                    "Move selected object",
                    "Move the selected scene object by one editor grid step.",
                    "SelectedEntity.Transform.Position",
                    context.selected_entity.clone(),
                    Some("position += grid step"),
                    "low",
                    "update_transform",
                    "update_scene_object",
                    json!({ "object": object }),
                ));
            }
        }
        if lower.contains("rotate") || lower.contains("draai") || lower.contains("rotation") {
            if let Some(object) = selected_object_payload(context, |object| {
                let transform = ensure_transform(object);
                let mut rotation = transform
                    .get("rotation")
                    .cloned()
                    .unwrap_or_else(|| json!({ "x": 0.0, "y": 0.0, "z": 0.0 }));
                add_vec3(&mut rotation, (0.0, 15.0, 0.0));
                transform["rotation"] = rotation;
            }) {
                actions.push(action(
                    context,
                    "Rotate selected object",
                    "Rotate the selected scene object 15 degrees around Y.",
                    "SelectedEntity.Transform.Rotation",
                    context.selected_entity.clone(),
                    Some("rotation.y += 15"),
                    "low",
                    "update_transform",
                    "update_scene_object",
                    json!({ "object": object }),
                ));
            }
        }
        if lower.contains("snow") || lower.contains("mountain") || lower.contains("world") {
            actions.push(action(
                context,
                "Adjust world preset",
                "Switch world settings toward a snowy mountain valley and reduce grass density.",
                "WorldSettings",
                None,
                Some("Snow biome, higher mountains, rock scatter on slopes"),
                "medium",
                "update_world_setting",
                "write_world_preset",
                json!({
                    "relativePath": "Worlds/AI_Snowy_Mountain_Valley/world.forgeworld",
                    "world": {
                        "type": "forge_world",
                        "name": "AI Snowy Mountain Valley",
                        "seed": 183927,
                        "map_size": 2048,
                        "terrain_resolution": 2049,
                        "max_height": 420,
                        "mountain_height": 900,
                        "performance_mode": "auto",
                        "created_with": "Wersee AI"
                    }
                }),
            ));
        }
        if lower.contains("blueprint") || lower.contains("node") {
            actions.push(action(
                context,
                "Create Blueprint starter nodes",
                "Add event, branch and action nodes for the requested gameplay logic.",
                "ActiveBlueprintGraph",
                None,
                Some("New node proposal"),
                "low",
                "create_blueprint_node",
                "create_blueprint_graph",
                json!({
                    "name": "AI_Generated_Graph",
                    "graphType": "Actor Blueprint"
                }),
            ));
        }
        if lower.contains("script") || lower.contains("forge file") || lower.contains("error") {
            actions.push(action(
                context,
                "Suggest Forge Script fix",
                "Create a Forge Script draft inside Source/AI for review.",
                "ForgeScript",
                context.diagnostics.first().cloned(),
                Some("Source/AI/WerseeGenerated.forge"),
                "medium",
                "suggest_script_fix",
                "create_forge_script",
                json!({
                    "relativePath": "Source/AI/WerseeGenerated.forge",
                    "content": forge_script_template(user_prompt)
                }),
            ));
        }
        if lower.contains("playable") || lower.contains("character") || lower.contains("wasd") {
            if let Some(object) = selected_object_payload(context, |object| {
                let components = object
                    .get_mut("components")
                    .and_then(Value::as_array_mut)
                    .expect("selected object components must be an array");
                push_component_once(
                    components,
                    "CharacterController",
                    json!({
                        "input": "WASD",
                        "cameraRelative": true,
                        "walkSpeed": 240.0,
                        "runSpeed": 460.0,
                        "sprintSpeed": 720.0,
                        "jumpHeight": 120.0
                    }),
                );
                push_component_once(
                    components,
                    "AnimationStateMachine",
                    json!({
                        "database": "Content/Characters/rigged_character/Animations/animation_database.json",
                        "proceduralSelection": true,
                        "footIk": true
                    }),
                );
                push_component_once(
                    components,
                    "PlayerStart",
                    json!({ "autoPossess": true, "spawnPriority": 100 }),
                );
            }) {
                actions.push(action(
                    context,
                    "Create playable character preset",
                    "Add CharacterController, AnimationStateMachine and PlayerStart to the selected character.",
                    "SelectedCharacter.Components",
                    context.selected_entity.clone(),
                    Some("Playable character components"),
                    "medium",
                    "create_playable_character",
                    "update_scene_object",
                    json!({ "object": object }),
                ));
            } else {
                actions.push(action(
                    context,
                    "Create playable character actor",
                    "Create a new playable character scene object with WASD controller components.",
                    "Scene.Character",
                    None,
                    Some("New playable character object"),
                    "medium",
                    "create_playable_character",
                    "create_scene_object",
                    json!({
                        "name": "PlayableCharacter",
                        "assetReference": "Characters/rigged_character.glb",
                        "components": [
                            { "componentType": "CharacterController", "data": { "input": "WASD", "cameraRelative": true } },
                            { "componentType": "AnimationStateMachine", "data": { "proceduralSelection": true, "footIk": true } },
                            { "componentType": "PlayerStart", "data": { "autoPossess": true } }
                        ]
                    }),
                ));
            }
        }
        if actions.is_empty() {
            actions.push(action(
                context,
                "Explain current context",
                "Analyze the selected context and suggest non-destructive next steps.",
                "ForgeContext",
                Some(context.summary.clone()),
                Some("Read-only explanation"),
                "low",
                "get_selected_entity",
                "read_only",
                json!({ "summary": context.summary }),
            ));
        }
        actions
    }
}

fn tool(name: &str, category: &str, description: &str, destructive: bool) -> AiToolDescriptor {
    AiToolDescriptor {
        name: name.to_string(),
        category: category.to_string(),
        description: description.to_string(),
        destructive,
        requires_confirmation: true,
    }
}

fn action(
    context: &AiContext,
    title: &str,
    description: &str,
    target: &str,
    before: Option<String>,
    after: Option<&str>,
    risk: &str,
    tool_name: &str,
    operation: &str,
    payload: Value,
) -> AiProposedAction {
    AiProposedAction {
        action_id: Uuid::new_v4().to_string(),
        title: title.to_string(),
        description: description.to_string(),
        target: target.to_string(),
        before,
        after: after.map(str::to_string),
        risk: risk.to_string(),
        requires_confirmation: true,
        tool_name: tool_name.to_string(),
        operation: operation.to_string(),
        payload,
        project_root: context.project_root.clone(),
        level_path: context.active_level_path.clone(),
        applied: false,
        result: None,
    }
}

fn selected_object_payload(context: &AiContext, mutate: impl FnOnce(&mut Value)) -> Option<Value> {
    let mut object = serde_json::from_str::<Value>(context.selected_entity.as_ref()?).ok()?;
    if object.get("transform").is_none() || object.get("transform") == Some(&Value::Null) {
        object["transform"] = json!({
            "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "scale": { "x": 1.0, "y": 1.0, "z": 1.0 }
        });
    }
    if object.get("components").and_then(Value::as_array).is_none() {
        object["components"] = json!([]);
    }
    mutate(&mut object);
    Some(object)
}

fn ensure_transform(object: &mut Value) -> &mut Value {
    if object.get("transform").is_none() || object.get("transform") == Some(&Value::Null) {
        object["transform"] = json!({
            "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
            "scale": { "x": 1.0, "y": 1.0, "z": 1.0 }
        });
    }
    object.get_mut("transform").expect("transform must exist")
}

fn add_vec3(value: &mut Value, delta: (f64, f64, f64)) {
    let x = value.get("x").and_then(Value::as_f64).unwrap_or(0.0) + delta.0;
    let y = value.get("y").and_then(Value::as_f64).unwrap_or(0.0) + delta.1;
    let z = value.get("z").and_then(Value::as_f64).unwrap_or(0.0) + delta.2;
    *value = json!({ "x": x, "y": y, "z": z });
}

fn push_component_once(components: &mut Vec<Value>, component_type: &str, data: Value) {
    if components.iter().any(|component| {
        component
            .get("componentType")
            .and_then(Value::as_str)
            .map(|value| value.eq_ignore_ascii_case(component_type))
            .unwrap_or(false)
    }) {
        return;
    }
    components.push(json!({ "componentType": component_type, "data": data }));
}

fn forge_script_template(user_prompt: &str) -> String {
    format!(
        r#"// Generated by Wersee AI for Forge.
// User intent: {user_prompt}

component WerseeGeneratedBehavior {{
    fn begin_play() {{
        log("Wersee AI behavior loaded.");
    }}

    fn tick(delta_time: float) {{
        // Add gameplay logic here after reviewing the generated draft.
    }}
}}
"#
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::context::AiContext;

    fn context() -> AiContext {
        AiContext {
            summary: "test".to_string(),
            project_root: Some("C:/ForgeProject".to_string()),
            selected_entity: Some(
                json!({
                    "id": "entity_1",
                    "name": "Cube",
                    "tags": [],
                    "layer": null,
                    "visible": true,
                    "assetReference": null,
                    "transform": {
                        "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
                        "rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
                        "scale": { "x": 1.0, "y": 1.0, "z": 1.0 }
                    },
                    "components": []
                })
                .to_string(),
            ),
            active_level: Some(json!({ "path": "Content/Scenes/Main.forge_scene" }).to_string()),
            active_level_path: Some("Content/Scenes/Main.forge_scene".to_string()),
            active_file: None,
            diagnostics: Vec::new(),
            allowed_tools: Vec::new(),
        }
    }

    #[test]
    fn proposes_real_scene_update_payload() {
        let actions = AiToolRouter::propose_actions("make it bigger", &context());
        let action = actions
            .iter()
            .find(|action| action.operation == "update_scene_object")
            .expect("scene update action");
        assert_eq!(action.project_root.as_deref(), Some("C:/ForgeProject"));
        assert_eq!(
            action.payload["object"]["transform"]["scale"]["x"].as_f64(),
            Some(1.25)
        );
    }

    #[test]
    fn proposes_forge_script_payload() {
        let actions = AiToolRouter::propose_actions("fix this forge script", &context());
        let action = actions
            .iter()
            .find(|action| action.operation == "create_forge_script")
            .expect("script action");
        assert!(action.payload["relativePath"]
            .as_str()
            .unwrap()
            .ends_with(".forge"));
        assert!(action.payload["content"]
            .as_str()
            .unwrap()
            .contains("WerseeGeneratedBehavior"));
    }
}
