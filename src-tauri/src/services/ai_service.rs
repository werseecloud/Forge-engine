use crate::models::scene::{SceneComponent, SceneObject, Transform, Vec3};
use crate::services::{blueprint_service, scene_service};
use crate::utils::ids::new_id;
use crate::utils::paths::{ensure_within, normalize_relative_path};
use anyhow::{anyhow, Result};
use forge_ai::{
    compatibility::assess, context::build_context, hardware_probe::probe_hardware,
    runtime::RuntimeManager, AiCompatibilityReport, AiContext, AiContextRequest, AiError,
    AiGenerationResult, AiPermissionSet, AiPrompt, AiProposedAction, AiToolDescriptor,
    AiToolRouter, GenerateOptions, InstalledModel, LocalAiRuntime, ModelRegistry, ModelStatus,
    PermissionMode, RuntimeModelHandle,
};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

static RUNTIME: OnceLock<Mutex<RuntimeManager>> = OnceLock::new();
static PERMISSIONS: OnceLock<Mutex<AiPermissionSet>> = OnceLock::new();
static ACTIONS: OnceLock<Mutex<HashMap<String, AiProposedAction>>> = OnceLock::new();

pub fn probe_device() -> Result<AiCompatibilityReport> {
    Ok(assess(probe_hardware()))
}

pub fn get_device_profile() -> Result<forge_ai::HardwareProfile> {
    Ok(probe_hardware())
}

pub fn list_installed_models() -> Result<Vec<InstalledModel>> {
    copy_bundled_models().ok();
    Ok(registry().scan()?)
}

pub fn import_model(path: String) -> Result<InstalledModel> {
    let model = registry().import_model(Path::new(&path))?;
    append_log(&format!("Imported model: {}", model.model_path)).ok();
    Ok(model)
}

pub fn validate_model(model_id: String) -> Result<ModelStatus> {
    let model = find_model(&model_id)?;
    Ok(model.status)
}

pub fn select_model(model_id: String) -> Result<InstalledModel> {
    let model = registry().select_model(&model_id)?;
    append_log(&format!("Selected AI model: {}", model.metadata.name)).ok();
    Ok(model)
}

pub fn load_model(model_id: String) -> Result<RuntimeModelHandle> {
    let model = find_model(&model_id)?;
    let mut runtime = RUNTIME
        .get_or_init(|| Mutex::new(RuntimeManager::default()))
        .lock()
        .map_err(|_| anyhow!("AI runtime lock failed"))?;
    let handle = runtime.load_model(model)?;
    append_log(&format!("Model load requested: {}", handle.backend)).ok();
    Ok(handle)
}

pub fn unload_model(model_id: String) -> Result<()> {
    let mut runtime = RUNTIME
        .get_or_init(|| Mutex::new(RuntimeManager::default()))
        .lock()
        .map_err(|_| anyhow!("AI runtime lock failed"))?;
    runtime.unload_model(&model_id)?;
    Ok(())
}

pub fn get_model_status(model_id: String) -> Result<ModelStatus> {
    let runtime = RUNTIME
        .get_or_init(|| Mutex::new(RuntimeManager::default()))
        .lock()
        .map_err(|_| anyhow!("AI runtime lock failed"))?;
    Ok(runtime.get_model_status(&model_id))
}

pub fn get_recommended_models() -> Result<AiCompatibilityReport> {
    probe_device()
}

pub fn build_ai_context(request: AiContextRequest) -> Result<AiContext> {
    Ok(build_context(request))
}

pub fn generate(prompt: AiPrompt, options: GenerateOptions) -> Result<AiGenerationResult> {
    let mut runtime = RUNTIME
        .get_or_init(|| Mutex::new(RuntimeManager::default()))
        .lock()
        .map_err(|_| anyhow!("AI runtime lock failed"))?;
    if let Ok(model) = registry().active_model() {
        runtime.load_model(model).ok();
    }
    Ok(runtime.generate(prompt, options)?)
}

pub fn cancel_generation(_job_id: String) -> Result<()> {
    Ok(())
}

pub fn get_available_tools() -> Result<Vec<AiToolDescriptor>> {
    Ok(AiToolRouter::tools())
}

pub fn propose_actions(user_prompt: String, context: AiContext) -> Result<Vec<AiProposedAction>> {
    let actions = AiToolRouter::propose_actions(&user_prompt, &context);
    let mut store = ACTIONS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|_| anyhow!("AI action lock failed"))?;
    for action in &actions {
        store.insert(action.action_id.clone(), action.clone());
    }
    Ok(actions)
}

pub fn preview_action(action_id: String) -> Result<AiProposedAction> {
    ACTIONS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|_| anyhow!("AI action lock failed"))?
        .get(&action_id)
        .cloned()
        .ok_or_else(|| anyhow!("AI action was not found: {action_id}"))
}

pub fn apply_action(action_id: String) -> Result<AiProposedAction> {
    let permissions = get_permissions()?;
    let mut store = ACTIONS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|_| anyhow!("AI action lock failed"))?;
    let action = store
        .get(&action_id)
        .cloned()
        .ok_or_else(|| anyhow!("AI action was not found: {action_id}"))?;
    let mut applied = apply_action_mutation(action, &permissions)?;
    applied.applied = true;
    store.insert(action_id.clone(), applied.clone());
    append_log(&format!(
        "AI action applied: {} ({})",
        applied.title, applied.operation
    ))
    .ok();
    Ok(applied)
}

pub fn reject_action(action_id: String) -> Result<()> {
    ACTIONS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .map_err(|_| anyhow!("AI action lock failed"))?
        .remove(&action_id);
    append_log("AI action rejected.").ok();
    Ok(())
}

pub fn get_permissions() -> Result<AiPermissionSet> {
    Ok(PERMISSIONS
        .get_or_init(|| Mutex::new(AiPermissionSet::default()))
        .lock()
        .map_err(|_| anyhow!("AI permission lock failed"))?
        .clone())
}

pub fn set_permissions(permissions: AiPermissionSet) -> Result<AiPermissionSet> {
    *PERMISSIONS
        .get_or_init(|| Mutex::new(AiPermissionSet::default()))
        .lock()
        .map_err(|_| anyhow!("AI permission lock failed"))? = permissions.clone();
    Ok(permissions)
}

pub fn enable_offline_mode(value: bool) -> Result<AiPermissionSet> {
    let mut permissions = get_permissions()?;
    permissions.local_only = value;
    if value {
        permissions.cloud_enabled = false;
    }
    set_permissions(permissions)
}

pub fn get_logs() -> Result<Vec<String>> {
    let path = logs_file()?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    Ok(fs::read_to_string(path)?
        .lines()
        .map(str::to_string)
        .collect())
}

pub fn clear_logs() -> Result<()> {
    fs::write(logs_file()?, "")?;
    Ok(())
}

fn registry() -> ModelRegistry {
    ModelRegistry::new(
        dirs::document_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Forge Engine"),
    )
}

fn find_model(model_id: &str) -> Result<InstalledModel> {
    registry()
        .scan()?
        .into_iter()
        .find(|model| model.model_id == model_id)
        .ok_or_else(|| anyhow!("AI model not found: {model_id}"))
}

fn copy_bundled_models() -> Result<()> {
    let registry = registry();
    registry.ensure_dirs()?;
    for root in bundled_model_roots() {
        if !root.exists() {
            continue;
        }
        for entry in fs::read_dir(root)? {
            let path = entry?.path();
            if path
                .extension()
                .and_then(|ext| ext.to_str())
                .map(str::to_lowercase)
                .as_deref()
                == Some("gguf")
            {
                let destination = registry.models_dir().join(
                    path.file_name()
                        .ok_or_else(|| anyhow!("invalid model file name"))?,
                );
                if !destination.exists() {
                    fs::copy(&path, destination)?;
                }
            }
        }
    }
    Ok(())
}

fn bundled_model_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if let Ok(current) = std::env::current_dir() {
        roots.push(current.join("engine/AI/Models"));
        roots.push(current.join("artifacts/windows/AI/Models"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            roots.push(parent.join("AI/Models"));
            roots.push(parent.join("engine/AI/Models"));
        }
    }
    roots
}

fn logs_file() -> Result<PathBuf> {
    let path = registry().ai_root().join("Logs").join("wersee_ai.log");
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(path)
}

fn append_log(message: &str) -> Result<()> {
    let line = format!("[{}] {message}\n", chrono::Utc::now().to_rfc3339());
    let path = logs_file()?;
    let previous = fs::read_to_string(&path).unwrap_or_default();
    fs::write(path, format!("{previous}{line}"))?;
    Ok(())
}

fn apply_action_mutation(
    mut action: AiProposedAction,
    permissions: &AiPermissionSet,
) -> Result<AiProposedAction> {
    match action.operation.as_str() {
        "read_only" => {
            action.applied = false;
            action.result =
                Some("Read-only action previewed. No project files were changed.".to_string());
            Ok(action)
        }
        "update_scene_object" => {
            ensure_permission(
                permissions,
                permissions.allow_edit_scene,
                "editing scene objects",
            )?;
            let project_root = required_project_root(&action)?;
            let level_path = required_level_path(&action)?;
            let object_value = action
                .payload
                .get("object")
                .cloned()
                .ok_or_else(|| anyhow!("AI scene action is missing object payload"))?;
            let object: SceneObject = serde_json::from_value(object_value)?;
            let saved = scene_service::update_scene_object(project_root, level_path, object)?;
            action.result = Some(serde_json::to_string(&saved)?);
            Ok(action)
        }
        "create_scene_object" => {
            ensure_permission(
                permissions,
                permissions.allow_edit_scene,
                "creating scene objects",
            )?;
            let project_root = required_project_root(&action)?;
            let level_path = required_level_path(&action)?;
            let mut level = scene_service::open_level(project_root.clone(), level_path.clone())?;
            let layer = level.layers.first().map(|item| item.id.clone());
            let components = action
                .payload
                .get("components")
                .cloned()
                .map(serde_json::from_value::<Vec<SceneComponent>>)
                .transpose()?
                .unwrap_or_default();
            let object = SceneObject {
                id: new_id("entity"),
                name: action
                    .payload
                    .get("name")
                    .and_then(|value| value.as_str())
                    .unwrap_or("AI Scene Object")
                    .to_string(),
                tags: vec!["ai-generated".to_string()],
                layer,
                visible: true,
                asset_reference: action
                    .payload
                    .get("assetReference")
                    .and_then(|value| value.as_str())
                    .map(str::to_string),
                transform: Some(Transform {
                    position: Vec3 {
                        x: 0.0,
                        y: 0.0,
                        z: 0.0,
                    },
                    rotation: Vec3 {
                        x: 0.0,
                        y: 0.0,
                        z: 0.0,
                    },
                    scale: Vec3 {
                        x: 1.0,
                        y: 1.0,
                        z: 1.0,
                    },
                }),
                components,
            };
            level.objects.push(object);
            let saved = scene_service::save_level(project_root, level)?;
            action.result = Some(serde_json::to_string(&saved)?);
            Ok(action)
        }
        "create_forge_script" => {
            ensure_permission(
                permissions,
                permissions.allow_edit_scripts,
                "writing Forge Script files",
            )?;
            let project_root = required_project_root(&action)?;
            let root = PathBuf::from(&project_root);
            let relative_path = action
                .payload
                .get("relativePath")
                .and_then(|value| value.as_str())
                .unwrap_or("Source/AI/WerseeGenerated.forge");
            let content = action
                .payload
                .get("content")
                .and_then(|value| value.as_str())
                .ok_or_else(|| anyhow!("AI script action is missing script content"))?;
            if !relative_path.replace('\\', "/").ends_with(".forge") {
                return Err(anyhow!("AI script actions can only write .forge files"));
            }
            let path = ensure_within(&root, &root.join(relative_path))?;
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&path, content)?;
            action.result = Some(format!("Wrote {}", normalize_relative_path(&path, &root)));
            Ok(action)
        }
        "create_blueprint_graph" => {
            ensure_permission(
                permissions,
                permissions.allow_edit_blueprints,
                "creating Blueprint graphs",
            )?;
            let project_root = required_project_root(&action)?;
            let name = action
                .payload
                .get("name")
                .and_then(|value| value.as_str())
                .unwrap_or("AI_Generated_Graph");
            let graph_type = action
                .payload
                .get("graphType")
                .and_then(|value| value.as_str())
                .unwrap_or("Actor Blueprint");
            let graph = blueprint_service::create_graph(&project_root, name, graph_type)?;
            action.result = Some(serde_json::to_string(&graph)?);
            Ok(action)
        }
        "write_world_preset" => {
            ensure_permission(
                permissions,
                permissions.allow_create_assets,
                "creating world assets",
            )?;
            let project_root = required_project_root(&action)?;
            let root = PathBuf::from(&project_root);
            let relative_path = action
                .payload
                .get("relativePath")
                .and_then(|value| value.as_str())
                .unwrap_or("Worlds/AI_World/world.forgeworld");
            let world = action
                .payload
                .get("world")
                .cloned()
                .ok_or_else(|| anyhow!("AI world action is missing world payload"))?;
            let path = ensure_within(&root, &root.join(relative_path))?;
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&path, serde_json::to_vec_pretty(&world)?)?;
            action.result = Some(format!("Wrote {}", normalize_relative_path(&path, &root)));
            Ok(action)
        }
        other => Err(anyhow!("Unsupported AI action operation: {other}")),
    }
}

fn ensure_permission(
    permissions: &AiPermissionSet,
    allowed: bool,
    action_name: &str,
) -> Result<()> {
    if allowed || matches!(permissions.mode, PermissionMode::AutopilotProjectMode) {
        return Ok(());
    }
    Err(AiError::PermissionDenied(format!(
        "Wersee AI is not allowed to apply {action_name}. Enable the matching permission in the AI Permissions tab."
    ))
    .into())
}

fn required_project_root(action: &AiProposedAction) -> Result<String> {
    action
        .project_root
        .clone()
        .ok_or_else(|| anyhow!("AI action requires an open project"))
}

fn required_level_path(action: &AiProposedAction) -> Result<String> {
    action
        .level_path
        .clone()
        .ok_or_else(|| anyhow!("AI action requires an active level"))
}
