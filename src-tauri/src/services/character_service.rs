use anyhow::{anyhow, Context, Result};
use chrono::Utc;
use forge_assets::inspect_gltf_or_glb;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;

use crate::models::character::{
    AnimationClipRecord, AnimationDatabase, AnimationPackRecord, AnimationSelectionInput,
    AnimationSelectionResult, AnimationStateDefinition, AnimationTransitionDefinition,
    CharacterAsset, CharacterImportRequest, CharacterImportResult, CharacterRuntimePlan,
    DefaultCharacterAssets, FootIkSettings, ForgeAutoRig, GeneratedAnimationStateMachine,
    HumanoidDetectionResult, MovementBlendSettings, PlayerControllerProfile,
};
use crate::models::scene::{SceneComponent, SceneObject, Transform, Vec3};
use crate::services::{log_service, scene_service};
use crate::utils::ids::new_id;
use crate::utils::paths::{
    ensure_within, normalize_relative_path, sanitize_file_stem, write_json_pretty,
};

const REQUIRED_HUMANOID_SLOTS: &[(&str, &[&str])] = &[
    ("hips", &["hips", "pelvis"]),
    ("spine", &["spine"]),
    ("head", &["head"]),
    (
        "leftUpperArm",
        &[
            "leftupperarm",
            "left_arm",
            "upperarm_l",
            "l_upperarm",
            "mixamorig:leftarm",
        ],
    ),
    (
        "rightUpperArm",
        &[
            "rightupperarm",
            "right_arm",
            "upperarm_r",
            "r_upperarm",
            "mixamorig:rightarm",
        ],
    ),
    (
        "leftUpperLeg",
        &[
            "leftupperleg",
            "leftupleg",
            "thigh_l",
            "l_thigh",
            "mixamorig:leftupleg",
        ],
    ),
    (
        "rightUpperLeg",
        &[
            "rightupperleg",
            "rightupleg",
            "thigh_r",
            "r_thigh",
            "mixamorig:rightupleg",
        ],
    ),
    (
        "leftFoot",
        &["leftfoot", "foot_l", "l_foot", "mixamorig:leftfoot"],
    ),
    (
        "rightFoot",
        &["rightfoot", "foot_r", "r_foot", "mixamorig:rightfoot"],
    ),
];

pub fn detect_humanoid(character_source_path: String) -> Result<HumanoidDetectionResult> {
    let source = PathBuf::from(character_source_path);
    let summary = inspect_gltf_or_glb(&source).map_err(|error| anyhow!(error.to_string()))?;
    let node_names = read_gltf_node_names(&source)?;
    let bone_map = build_bone_map(&node_names);
    let bones_found = bone_map.values().cloned().collect::<Vec<_>>();
    let missing_bones = REQUIRED_HUMANOID_SLOTS
        .iter()
        .filter_map(|(slot, _)| (!bone_map.contains_key(*slot)).then(|| slot.to_string()))
        .collect::<Vec<_>>();
    let confidence = bone_map.len() as f32 / REQUIRED_HUMANOID_SLOTS.len() as f32;

    Ok(HumanoidDetectionResult {
        is_humanoid: confidence >= 0.66,
        confidence,
        bones_found,
        missing_bones,
        skeleton_bone_count: node_names.len(),
        mesh_count: summary.mesh_count,
        animation_count: summary.animation_count,
    })
}

pub fn discover_default_character_assets() -> Result<DefaultCharacterAssets> {
    let mut searched_roots = Vec::new();
    let mut roots = Vec::new();
    if let Ok(current_dir) = std::env::current_dir() {
        roots.push(current_dir);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            roots.push(parent.to_path_buf());
        }
    }
    if let Some(downloads) = dirs::download_dir() {
        roots.push(downloads);
    }
    roots.sort();
    roots.dedup();

    let mut character_model_path = None;
    let mut pack_paths = BTreeSet::new();
    for root in roots {
        searched_roots.push(root.to_string_lossy().to_string());
        for candidate in [
            root.join("engine/StarterContent/Characters/rigged_character.glb"),
            root.join("StarterContent/Characters/rigged_character.glb"),
            root.join("rigged_character.glb"),
        ] {
            if character_model_path.is_none() && candidate.exists() {
                character_model_path = Some(candidate.to_string_lossy().to_string());
            }
        }
        for relative in [
            "engine/AnimationPacks/Universal Animation Library[Standard].zip",
            "engine/AnimationPacks/Animations_V1_01.zip",
            "engine/AnimationPacks/Universal Animation Library 2[Standard].zip",
            "AnimationPacks/Universal Animation Library[Standard].zip",
            "AnimationPacks/Animations_V1_01.zip",
            "AnimationPacks/Universal Animation Library 2[Standard].zip",
            "Universal Animation Library[Standard].zip",
            "Animations_V1_01.zip",
            "Universal Animation Library 2[Standard].zip",
        ] {
            let candidate = root.join(relative);
            if candidate.exists() {
                pack_paths.insert(candidate.to_string_lossy().to_string());
            }
        }
    }

    Ok(DefaultCharacterAssets {
        character_model_path,
        animation_pack_paths: pack_paths.into_iter().collect(),
        searched_roots,
    })
}

pub fn index_animation_packs(animation_pack_paths: Vec<String>) -> Result<AnimationDatabase> {
    let mut packs = Vec::new();
    let mut clips = Vec::new();
    let mut locomotion_sets: BTreeMap<String, Vec<String>> = BTreeMap::new();

    for pack_path in animation_pack_paths {
        let path = PathBuf::from(&pack_path);
        if !path.exists() {
            return Err(anyhow!("Animation pack does not exist: {}", path.display()));
        }
        let metadata = fs::metadata(&path)?;
        let file = File::open(&path)
            .with_context(|| format!("Could not open animation pack {}", path.display()))?;
        let mut archive = ZipArchive::new(file).with_context(|| {
            format!(
                "Animation pack is not a readable zip archive: {}",
                path.display()
            )
        })?;
        let mut pack_clip_count = 0usize;
        let display_name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        for index in 0..archive.len() {
            let entry = archive.by_index(index)?;
            if entry.is_dir() {
                continue;
            }
            let relative_path = entry.name().replace('\\', "/");
            if !is_animation_file(&relative_path) {
                continue;
            }
            let name = Path::new(&relative_path)
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .replace(['_', '-'], " ");
            let tags = classify_animation_tags(&relative_path);
            let locomotion = tags.iter().find(|tag| is_locomotion_tag(tag)).cloned();
            let id = new_id("clip");
            if let Some(group) = &locomotion {
                locomotion_sets
                    .entry(group.clone())
                    .or_default()
                    .push(id.clone());
            }
            clips.push(AnimationClipRecord {
                id,
                name,
                source_pack: display_name.clone(),
                relative_path,
                size_bytes: entry.size(),
                tags,
                locomotion,
                duration_seconds: None,
            });
            pack_clip_count += 1;
        }

        packs.push(AnimationPackRecord {
            path: path.to_string_lossy().to_string(),
            display_name,
            size_bytes: metadata.len(),
            clip_count: pack_clip_count,
        });
    }

    Ok(AnimationDatabase {
        database_id: new_id("animdb"),
        indexed_at: Utc::now().to_rfc3339(),
        packs,
        clips,
        locomotion_sets,
    })
}

pub fn import_character(request: CharacterImportRequest) -> Result<CharacterImportResult> {
    let project_root = PathBuf::from(&request.project_root);
    if !project_root.exists() {
        return Err(anyhow!(
            "Project root does not exist: {}",
            project_root.display()
        ));
    }
    let content_root = project_root.join("Content");
    fs::create_dir_all(&content_root)?;

    let source = PathBuf::from(&request.character_source_path);
    if !source.exists() {
        return Err(anyhow!(
            "Character GLB does not exist: {}",
            source.display()
        ));
    }
    let extension = source
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_ascii_lowercase();
    if extension != "glb" && extension != "gltf" {
        return Err(anyhow!(
            "Character import expects a .glb or .gltf file: {}",
            source.display()
        ));
    }

    let humanoid = detect_humanoid(source.to_string_lossy().to_string())?;
    let animation_database = index_animation_packs(request.animation_pack_paths.clone())?;
    let character_name = request.character_name.unwrap_or_else(|| {
        source
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    });
    let safe_name = sanitize_file_stem(&character_name);
    let character_root = ensure_within(
        &content_root,
        &content_root.join("Characters").join(&safe_name),
    )?;
    let model_dir = character_root.join("Model");
    let rig_dir = character_root.join("Rig");
    let animation_dir = character_root.join("Animations");
    let controller_dir = character_root.join("Controller");
    for directory in [&model_dir, &rig_dir, &animation_dir, &controller_dir] {
        fs::create_dir_all(directory)?;
    }

    let model_file = model_dir.join(format!("{}.{}", safe_name, extension));
    fs::copy(&source, &model_file).with_context(|| {
        format!(
            "Could not copy character model from {} to {}",
            source.display(),
            model_file.display()
        )
    })?;

    let node_names = read_gltf_node_names(&model_file)?;
    let bone_map = build_bone_map(&node_names);
    let rig = ForgeAutoRig {
        rig_id: new_id("rig"),
        rig_type: if humanoid.is_humanoid {
            "Humanoid".to_string()
        } else {
            "GenericSkeleton".to_string()
        },
        retarget_profile: "ForgeHumanoidV1".to_string(),
        humanoid_slots: REQUIRED_HUMANOID_SLOTS
            .iter()
            .map(|(slot, _)| slot.to_string())
            .collect(),
        foot_ik: FootIkSettings {
            enabled: bone_map.contains_key("leftFoot") && bone_map.contains_key("rightFoot"),
            left_foot_bone: bone_map.get("leftFoot").cloned(),
            right_foot_bone: bone_map.get("rightFoot").cloned(),
            pelvis_bone: bone_map.get("hips").cloned(),
            trace_distance: 60.0,
            blend_speed: 18.0,
        },
        bone_map,
    };
    let controller = default_player_controller();

    let rig_path = rig_dir.join("forge_autorig.json");
    let anim_db_path = animation_dir.join("animation_database.json");
    let controller_path = controller_dir.join("player_controller.json");
    write_json_pretty(&rig_path, &rig)?;
    write_json_pretty(&anim_db_path, &animation_database)?;
    write_json_pretty(&controller_path, &controller)?;

    let character = CharacterAsset {
        character_id: new_id("character"),
        name: character_name,
        source_glb: source.to_string_lossy().to_string(),
        project_character_path: character_root.to_string_lossy().to_string(),
        model_relative_path: normalize_relative_path(&model_file, &content_root),
        rig_path: rig_path.to_string_lossy().to_string(),
        animation_database_path: anim_db_path.to_string_lossy().to_string(),
        controller_path: controller_path.to_string_lossy().to_string(),
        rig,
        controller,
    };
    let manifest_path = character_root.join("character.forge_character");
    write_json_pretty(&manifest_path, &character)?;

    let mut generated_files = vec![
        model_file.to_string_lossy().to_string(),
        rig_path.to_string_lossy().to_string(),
        anim_db_path.to_string_lossy().to_string(),
        controller_path.to_string_lossy().to_string(),
        manifest_path.to_string_lossy().to_string(),
    ];

    let mut placed_object_id = None;
    if let Some(level_path) = request.place_in_level_path {
        let object = make_character_scene_object(&character, &animation_database);
        placed_object_id = Some(object.id.clone());
        let mut level =
            scene_service::open_level(request.project_root.clone(), level_path.clone())?;
        level.objects.push(object);
        let saved = scene_service::save_level(request.project_root.clone(), level)?;
        generated_files.push(saved.path);
    }

    let mut warnings = Vec::new();
    if !humanoid.is_humanoid {
        warnings.push(format!(
            "Humanoid confidence is {:.0}%; missing slots: {}",
            humanoid.confidence * 100.0,
            humanoid.missing_bones.join(", ")
        ));
    }
    if animation_database.clips.is_empty() {
        warnings.push("No animation clips were found in the selected packs.".to_string());
    }

    log_service::append_output_log(&format!(
        "Imported character '{}' with {} animation clips",
        character.name,
        animation_database.clips.len()
    ))?;

    Ok(CharacterImportResult {
        character,
        humanoid,
        animation_database,
        placed_object_id,
        generated_files,
        warnings,
    })
}

pub fn build_character_runtime_plan(
    project_root: String,
    character_manifest_path: String,
) -> Result<CharacterRuntimePlan> {
    let project_root = PathBuf::from(project_root);
    let content_root = project_root.join("Content");
    let manifest_path = ensure_within(&content_root, &PathBuf::from(character_manifest_path))?;
    let character: CharacterAsset = serde_json::from_slice(&fs::read(&manifest_path)?)?;
    let database: AnimationDatabase =
        serde_json::from_slice(&fs::read(&character.animation_database_path)?)?;
    let required = character.controller.states.clone();
    let available_tags = database
        .clips
        .iter()
        .flat_map(|clip| clip.tags.iter().cloned())
        .collect::<BTreeSet<_>>();
    let missing_states = required
        .iter()
        .filter(|state| !available_tags.contains(&state.to_ascii_lowercase()))
        .cloned()
        .collect::<Vec<_>>();

    Ok(CharacterRuntimePlan {
        character_id: character.character_id,
        controller_path: character.controller_path,
        animation_database_path: character.animation_database_path,
        required_states: required,
        playable: missing_states.is_empty(),
        missing_states,
    })
}

pub fn select_procedural_animation(
    input: AnimationSelectionInput,
) -> Result<AnimationSelectionResult> {
    let database: AnimationDatabase =
        serde_json::from_slice(&fs::read(&input.animation_database_path).with_context(|| {
            format!(
                "Could not read animation database {}",
                input.animation_database_path
            )
        })?)?;
    let speed = horizontal_length(input.velocity.x, input.velocity.z);
    let acceleration = horizontal_length(input.acceleration.x, input.acceleration.z);
    let direction = movement_direction(&input);
    let mut reasons = Vec::new();

    let selected_state = if !input.grounded {
        reasons.push("Character is airborne.".to_string());
        if input.velocity.y > 0.3 {
            "jump".to_string()
        } else {
            "fall".to_string()
        }
    } else if input.jump_pressed {
        reasons.push("Jump input is active while grounded.".to_string());
        "jump".to_string()
    } else if input.crouching && speed > 0.2 {
        reasons.push("Crouch input and horizontal movement are active.".to_string());
        "crouch".to_string()
    } else if input.crouching {
        reasons.push("Crouch input is active.".to_string());
        "crouch".to_string()
    } else if direction == "left" || direction == "right" {
        reasons.push(format!("Movement direction is {direction}."));
        "strafe".to_string()
    } else if speed < 0.15 {
        reasons.push("Horizontal speed is below idle threshold.".to_string());
        "idle".to_string()
    } else if input.sprinting && speed >= 4.5 {
        reasons.push("Sprint input is active and speed is high.".to_string());
        "sprint".to_string()
    } else if speed >= 2.4 || acceleration >= 3.0 {
        reasons.push("Speed or acceleration is in run range.".to_string());
        "run".to_string()
    } else {
        reasons.push("Speed is in walk range.".to_string());
        "walk".to_string()
    };

    let selected_clip =
        find_best_clip(&database, &selected_state, &direction).or_else(|| fallback_clip(&database));
    let mut warnings = Vec::new();
    if selected_clip.is_none() {
        warnings.push(format!(
            "No animation clips are available in {}",
            input.animation_database_path
        ));
    } else if !database.locomotion_sets.contains_key(&selected_state) {
        warnings.push(format!(
            "No exact '{selected_state}' clip was found; using fallback clip."
        ));
    }
    let blend_seconds = blend_time(input.last_state.as_deref(), &selected_state);

    Ok(AnimationSelectionResult {
        selected_state,
        selected_clip,
        blend_seconds,
        speed,
        direction,
        reasons,
        warnings,
    })
}

pub fn generate_animation_state_machine(
    animation_database_path: String,
) -> Result<GeneratedAnimationStateMachine> {
    let database: AnimationDatabase =
        serde_json::from_slice(&fs::read(&animation_database_path).with_context(|| {
            format!("Could not read animation database {animation_database_path}")
        })?)?;
    let required_states = [
        "idle", "walk", "run", "sprint", "strafe", "jump", "fall", "land", "crouch", "turn",
        "lean",
    ];
    let states = required_states
        .iter()
        .map(|state| AnimationStateDefinition {
            state: (*state).to_string(),
            clip_ids: database
                .locomotion_sets
                .get(*state)
                .cloned()
                .unwrap_or_default(),
        })
        .collect::<Vec<_>>();
    let missing_states = states
        .iter()
        .filter(|state| state.clip_ids.is_empty())
        .map(|state| state.state.clone())
        .collect::<Vec<_>>();
    let transitions = vec![
        transition("idle", "walk", "speed > 0.15", 0.18),
        transition("walk", "run", "speed >= 2.4 or acceleration >= 3.0", 0.22),
        transition("run", "sprint", "sprinting and speed >= 4.5", 0.28),
        transition("walk", "strafe", "abs(side_input) > abs(forward_input)", 0.16),
        transition("run", "jump", "jump_pressed", 0.08),
        transition("jump", "fall", "vertical_velocity < 0", 0.12),
        transition("fall", "land", "grounded", 0.1),
        transition("land", "idle", "speed < 0.15", 0.16),
        transition("idle", "crouch", "crouching", 0.12),
        transition("crouch", "walk", "not crouching and speed > 0.15", 0.18),
    ];

    Ok(GeneratedAnimationStateMachine {
        states,
        transitions,
        missing_states,
    })
}

fn make_character_scene_object(
    character: &CharacterAsset,
    database: &AnimationDatabase,
) -> SceneObject {
    SceneObject {
        id: new_id("entity"),
        name: character.name.clone(),
        tags: vec!["character".to_string(), "player".to_string()],
        layer: None,
        visible: true,
        asset_reference: Some(character.model_relative_path.clone()),
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
        components: vec![
            SceneComponent {
                component_type: "CharacterController".to_string(),
                data: serde_json::json!({
                    "controllerPath": character.controller_path,
                    "wasdEnabled": character.controller.wasd_enabled,
                    "sprintKey": character.controller.sprint_key,
                    "jumpKey": character.controller.jump_key,
                    "crouchKey": character.controller.crouch_key,
                    "playOnStart": true
                }),
            },
            SceneComponent {
                component_type: "SkeletalMesh".to_string(),
                data: serde_json::json!({
                    "model": character.model_relative_path,
                    "rig": character.rig_path,
                    "retargetProfile": character.rig.retarget_profile,
                    "humanoid": character.rig.rig_type == "Humanoid"
                }),
            },
            SceneComponent {
                component_type: "AnimationStateMachine".to_string(),
                data: serde_json::json!({
                    "database": character.animation_database_path,
                    "clipCount": database.clips.len(),
                    "states": character.controller.states,
                    "defaultState": "idle",
                    "footIk": character.rig.foot_ik.enabled
                }),
            },
            SceneComponent {
                component_type: "PlayerStart".to_string(),
                data: serde_json::json!({
                    "spawnMode": "UseCharacterTransform",
                    "possessOnPlay": true
                }),
            },
        ],
    }
}

fn default_player_controller() -> PlayerControllerProfile {
    PlayerControllerProfile {
        controller_id: new_id("controller"),
        wasd_enabled: true,
        sprint_key: "ShiftLeft".to_string(),
        jump_key: "Space".to_string(),
        crouch_key: "ControlLeft".to_string(),
        movement_blend: MovementBlendSettings {
            idle_to_walk: 0.18,
            walk_to_run: 0.22,
            run_to_sprint: 0.28,
            strafe_blend: 0.16,
            turn_blend: 0.12,
            lean_strength: 0.35,
        },
        states: [
            "idle", "walk", "run", "sprint", "strafe", "jump", "fall", "land", "crouch", "turn",
            "lean",
        ]
        .iter()
        .map(|state| state.to_string())
        .collect(),
    }
}

fn is_animation_file(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    matches!(
        Path::new(&lower).extension().and_then(|item| item.to_str()),
        Some("fbx" | "bvh" | "glb" | "gltf" | "anim" | "dae")
    )
}

fn is_locomotion_tag(tag: &str) -> bool {
    matches!(
        tag,
        "idle"
            | "walk"
            | "run"
            | "sprint"
            | "strafe"
            | "jump"
            | "fall"
            | "land"
            | "crouch"
            | "turn"
            | "lean"
    )
}

fn find_best_clip(
    database: &AnimationDatabase,
    selected_state: &str,
    direction: &str,
) -> Option<AnimationClipRecord> {
    let ids = database.locomotion_sets.get(selected_state)?;
    let clips = ids
        .iter()
        .filter_map(|id| database.clips.iter().find(|clip| &clip.id == id))
        .collect::<Vec<_>>();
    let direction_match = clips.iter().find(|clip| {
        (direction == "left" && clip.tags.iter().any(|tag| tag == "left"))
            || (direction == "right" && clip.tags.iter().any(|tag| tag == "right"))
            || (direction == "backward" && clip.tags.iter().any(|tag| tag == "backward"))
            || (direction == "forward" && clip.tags.iter().any(|tag| tag == "forward"))
    });
    direction_match
        .or_else(|| clips.first())
        .map(|clip| (*clip).clone())
}

fn fallback_clip(database: &AnimationDatabase) -> Option<AnimationClipRecord> {
    for state in ["idle", "walk", "run", "uncategorized"] {
        if let Some(ids) = database.locomotion_sets.get(state) {
            if let Some(clip) = ids
                .iter()
                .filter_map(|id| database.clips.iter().find(|clip| &clip.id == id))
                .next()
            {
                return Some(clip.clone());
            }
        }
    }
    database.clips.first().cloned()
}

fn movement_direction(input: &AnimationSelectionInput) -> String {
    let speed = horizontal_length(input.velocity.x, input.velocity.z);
    if speed < 0.15 {
        return "none".to_string();
    }
    let forward = normalize_2d(input.camera_forward.x, input.camera_forward.z).unwrap_or((0.0, -1.0));
    let right = (forward.1, -forward.0);
    let velocity = normalize_2d(input.velocity.x, input.velocity.z).unwrap_or((0.0, 0.0));
    let forward_dot = dot_2d(velocity, forward);
    let right_dot = dot_2d(velocity, right);
    if right_dot > 0.55 {
        "right".to_string()
    } else if right_dot < -0.55 {
        "left".to_string()
    } else if forward_dot < -0.35 {
        "backward".to_string()
    } else {
        "forward".to_string()
    }
}

fn blend_time(last_state: Option<&str>, next_state: &str) -> f32 {
    if last_state == Some(next_state) {
        0.0
    } else if next_state == "jump" || next_state == "land" {
        0.08
    } else if next_state == "sprint" {
        0.28
    } else if next_state == "strafe" {
        0.16
    } else {
        0.18
    }
}

fn transition(
    from: &str,
    to: &str,
    condition: &str,
    blend_seconds: f32,
) -> AnimationTransitionDefinition {
    AnimationTransitionDefinition {
        from: from.to_string(),
        to: to.to_string(),
        condition: condition.to_string(),
        blend_seconds,
    }
}

fn horizontal_length(x: f32, z: f32) -> f32 {
    (x.mul_add(x, z * z)).sqrt()
}

fn normalize_2d(x: f32, z: f32) -> Option<(f32, f32)> {
    let length = horizontal_length(x, z);
    (length > 0.0001).then_some((x / length, z / length))
}

fn dot_2d(a: (f32, f32), b: (f32, f32)) -> f32 {
    a.0.mul_add(b.0, a.1 * b.1)
}

fn classify_animation_tags(path: &str) -> Vec<String> {
    let lower = path.to_ascii_lowercase();
    let mut tags = Vec::new();
    for tag in [
        "idle", "walk", "run", "sprint", "strafe", "jump", "fall", "land", "crouch", "turn", "lean",
    ] {
        if lower.contains(tag) {
            tags.push(tag.to_string());
        }
    }
    if lower.contains("left") {
        tags.push("left".to_string());
    }
    if lower.contains("right") {
        tags.push("right".to_string());
    }
    if lower.contains("back") {
        tags.push("backward".to_string());
    }
    if lower.contains("forward") {
        tags.push("forward".to_string());
    }
    if tags.is_empty() {
        tags.push("uncategorized".to_string());
    }
    tags
}

fn build_bone_map(node_names: &[String]) -> BTreeMap<String, String> {
    let mut bone_map = BTreeMap::new();
    for (slot, aliases) in REQUIRED_HUMANOID_SLOTS {
        if let Some(name) = node_names.iter().find(|name| {
            let normalized = normalize_bone_name(name);
            aliases
                .iter()
                .any(|alias| normalized.contains(&normalize_bone_name(alias)))
        }) {
            bone_map.insert(slot.to_string(), name.clone());
        }
    }
    bone_map
}

fn normalize_bone_name(name: &str) -> String {
    name.chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .collect::<String>()
        .to_ascii_lowercase()
}

fn read_gltf_node_names(path: &Path) -> Result<Vec<String>> {
    let extension = path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_ascii_lowercase();
    let json = if extension == "glb" {
        read_glb_json(path)?
    } else {
        fs::read_to_string(path)?
    };
    let value: Value = serde_json::from_str(&json)?;
    let nodes = value
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or_else(|| {
            anyhow!(
                "GLB/GLTF does not contain a nodes array: {}",
                path.display()
            )
        })?;
    Ok(nodes
        .iter()
        .filter_map(|node| {
            node.get("name")
                .and_then(Value::as_str)
                .map(ToString::to_string)
        })
        .collect())
}

fn read_glb_json(path: &Path) -> Result<String> {
    let mut bytes = Vec::new();
    File::open(path)?.read_to_end(&mut bytes)?;
    if bytes.len() < 20 || &bytes[0..4] != b"glTF" {
        return Err(anyhow!("Invalid GLB header: {}", path.display()));
    }
    let chunk_length_bytes: [u8; 4] = bytes
        .get(12..16)
        .ok_or_else(|| anyhow!("GLB JSON chunk length is missing: {}", path.display()))?
        .try_into()
        .map_err(|_| anyhow!("Invalid GLB JSON chunk length: {}", path.display()))?;
    let chunk_type_bytes: [u8; 4] = bytes
        .get(16..20)
        .ok_or_else(|| anyhow!("GLB JSON chunk type is missing: {}", path.display()))?
        .try_into()
        .map_err(|_| anyhow!("Invalid GLB JSON chunk type: {}", path.display()))?;
    let chunk_length = u32::from_le_bytes(chunk_length_bytes) as usize;
    let chunk_type = u32::from_le_bytes(chunk_type_bytes);
    if chunk_type != 0x4E4F534A {
        return Err(anyhow!("First GLB chunk is not JSON: {}", path.display()));
    }
    let end = 20 + chunk_length;
    if bytes.len() < end {
        return Err(anyhow!("GLB JSON chunk is truncated: {}", path.display()));
    }
    Ok(String::from_utf8_lossy(&bytes[20..end])
        .trim_end_matches('\0')
        .to_string())
}
