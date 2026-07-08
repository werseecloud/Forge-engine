use crate::context::AiContext;
use serde::{Deserialize, Serialize};
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
            actions.push(action(
                "Scale selected object",
                "Set selected object scale to 1.25 on all axes.",
                "SelectedEntity.Transform.Scale",
                None,
                Some("1.25,1.25,1.25"),
                "low",
                "update_transform",
            ));
        }
        if lower.contains("snow") || lower.contains("mountain") || lower.contains("world") {
            actions.push(action(
                "Adjust world preset",
                "Switch world settings toward a snowy mountain valley and reduce grass density.",
                "WorldSettings",
                None,
                Some("Snow biome, higher mountains, rock scatter on slopes"),
                "medium",
                "update_world_setting",
            ));
        }
        if lower.contains("blueprint") || lower.contains("node") {
            actions.push(action(
                "Create Blueprint starter nodes",
                "Add event, branch and action nodes for the requested gameplay logic.",
                "ActiveBlueprintGraph",
                None,
                Some("New node proposal"),
                "low",
                "create_blueprint_node",
            ));
        }
        if lower.contains("script") || lower.contains("forge file") || lower.contains("error") {
            actions.push(action(
                "Suggest Forge Script fix",
                "Read diagnostics and propose a diff before modifying any script file.",
                "ForgeScript",
                context.diagnostics.first().cloned(),
                Some("Patch proposal"),
                "medium",
                "suggest_script_fix",
            ));
        }
        if lower.contains("playable") || lower.contains("character") || lower.contains("wasd") {
            actions.push(action("Create playable character preset", "Add CharacterController, SkeletalMesh, AnimationStateMachine and PlayerStart proposal.", "SelectedCharacter", None, Some("Playable character components"), "medium", "create_playable_character"));
        }
        if actions.is_empty() {
            actions.push(action(
                "Explain current context",
                "Analyze the selected context and suggest non-destructive next steps.",
                "ForgeContext",
                Some(context.summary.clone()),
                Some("Read-only explanation"),
                "low",
                "get_selected_entity",
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
    title: &str,
    description: &str,
    target: &str,
    before: Option<String>,
    after: Option<&str>,
    risk: &str,
    tool_name: &str,
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
    }
}
