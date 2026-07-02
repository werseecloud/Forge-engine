use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterImportRequest {
    pub project_root: String,
    pub character_source_path: String,
    pub animation_pack_paths: Vec<String>,
    pub character_name: Option<String>,
    pub place_in_level_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterImportResult {
    pub character: CharacterAsset,
    pub humanoid: HumanoidDetectionResult,
    pub animation_database: AnimationDatabase,
    pub placed_object_id: Option<String>,
    pub generated_files: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterAsset {
    pub character_id: String,
    pub name: String,
    pub source_glb: String,
    pub project_character_path: String,
    pub model_relative_path: String,
    pub rig_path: String,
    pub animation_database_path: String,
    pub controller_path: String,
    pub rig: ForgeAutoRig,
    pub controller: PlayerControllerProfile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HumanoidDetectionResult {
    pub is_humanoid: bool,
    pub confidence: f32,
    pub bones_found: Vec<String>,
    pub missing_bones: Vec<String>,
    pub skeleton_bone_count: usize,
    pub mesh_count: usize,
    pub animation_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeAutoRig {
    pub rig_id: String,
    pub rig_type: String,
    pub retarget_profile: String,
    pub bone_map: BTreeMap<String, String>,
    pub humanoid_slots: Vec<String>,
    pub foot_ik: FootIkSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FootIkSettings {
    pub enabled: bool,
    pub left_foot_bone: Option<String>,
    pub right_foot_bone: Option<String>,
    pub pelvis_bone: Option<String>,
    pub trace_distance: f32,
    pub blend_speed: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationDatabase {
    pub database_id: String,
    pub indexed_at: String,
    pub packs: Vec<AnimationPackRecord>,
    pub clips: Vec<AnimationClipRecord>,
    pub locomotion_sets: BTreeMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationPackRecord {
    pub path: String,
    pub display_name: String,
    pub size_bytes: u64,
    pub clip_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationClipRecord {
    pub id: String,
    pub name: String,
    pub source_pack: String,
    pub relative_path: String,
    pub size_bytes: u64,
    pub tags: Vec<String>,
    pub locomotion: Option<String>,
    pub duration_seconds: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerControllerProfile {
    pub controller_id: String,
    pub wasd_enabled: bool,
    pub sprint_key: String,
    pub jump_key: String,
    pub crouch_key: String,
    pub movement_blend: MovementBlendSettings,
    pub states: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovementBlendSettings {
    pub idle_to_walk: f32,
    pub walk_to_run: f32,
    pub run_to_sprint: f32,
    pub strafe_blend: f32,
    pub turn_blend: f32,
    pub lean_strength: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterRuntimePlan {
    pub character_id: String,
    pub controller_path: String,
    pub animation_database_path: String,
    pub required_states: Vec<String>,
    pub missing_states: Vec<String>,
    pub playable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefaultCharacterAssets {
    pub character_model_path: Option<String>,
    pub animation_pack_paths: Vec<String>,
    pub searched_roots: Vec<String>,
}
