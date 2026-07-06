use crate::models::scene::SceneLevel;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorldRequest {
    pub project_root: String,
    pub level_path: String,
    pub config: WorldConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorldResult {
    pub world: ForgeWorldFile,
    pub level: SceneLevel,
    pub generated_files: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldConfig {
    pub world_name: String,
    pub world_type: WorldType,
    pub map_size: MapSize,
    pub custom_map_size: Option<u32>,
    pub terrain_resolution: u32,
    pub seed: u32,
    pub terrain: TerrainSettings,
    pub textures: TextureSettings,
    pub environment: EnvironmentSettings,
    pub performance: WorldPerformanceSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WorldType {
    EmptyWorld,
    Grassland,
    Mountains,
    Forest,
    Desert,
    Snow,
    Island,
    RockyValley,
    ProceduralMixedWorld,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MapSize {
    Small,
    Medium,
    Large,
    Huge,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum QualityMode {
    Auto,
    Low,
    Medium,
    High,
    Ultra,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerrainSettings {
    pub max_height: f32,
    pub mountain_height: f32,
    pub hill_strength: f32,
    pub valley_depth: f32,
    pub roughness: f32,
    pub erosion: f32,
    pub noise_scale: f32,
    pub biome_blending: f32,
    pub water_level: f32,
    pub flat_spawn_area: bool,
    pub player_spawn_point: [f32; 3],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextureSettings {
    pub use_standard_forge_textures: bool,
    pub use_pbr_textures: bool,
    pub texture_resolution: QualityMode,
    pub auto_optimize_textures: bool,
    pub terrain_material_preset: String,
    pub blend_by_height: bool,
    pub blend_by_slope: bool,
    pub blend_by_biome: bool,
    pub pbr_layers: Vec<WorldMaterialLayer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldMaterialLayer {
    pub name: String,
    pub albedo_texture: Option<String>,
    pub normal_texture: Option<String>,
    pub roughness_texture: Option<String>,
    pub metallic_texture: Option<String>,
    pub ao_texture: Option<String>,
    pub height_texture: Option<String>,
    pub mask_map: Option<String>,
    pub tiling: f32,
    pub strength: f32,
    pub height_min: f32,
    pub height_max: f32,
    pub slope_min: f32,
    pub slope_max: f32,
    pub biome_mask: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentSettings {
    pub grass_density: f32,
    pub rock_density: f32,
    pub tree_density: f32,
    pub bush_density: f32,
    pub flower_density: f32,
    pub random_object_placement: bool,
    pub object_scale_variation: f32,
    pub object_rotation_variation: f32,
    pub avoid_spawn_area: bool,
    pub avoid_water: bool,
    pub align_objects_to_slope: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldPerformanceSettings {
    pub auto_detect_pc_performance: bool,
    pub texture_quality: QualityMode,
    pub terrain_lod: QualityMode,
    pub grass_quality: QualityMode,
    pub rock_quality: QualityMode,
    pub foliage_distance: f32,
    pub object_density_multiplier: f32,
    pub terrain_chunks: bool,
    pub streaming: bool,
    pub occlusion_culling: bool,
    pub impostors: bool,
    pub texture_compression: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeWorldFile {
    pub file_type: String,
    pub name: String,
    pub world_id: String,
    pub seed: u32,
    pub map_size: u32,
    pub terrain_resolution: u32,
    pub max_height: f32,
    pub mountain_height: f32,
    pub performance_mode: QualityMode,
    pub materials: Vec<WorldMaterialLayer>,
    pub scatter_layers: Vec<ScatterLayerMetadata>,
    pub terrain: TerrainOutputMetadata,
    pub created_with: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerrainOutputMetadata {
    pub heightmap_path: String,
    pub splatmap_path: String,
    pub sample_resolution: u32,
    pub chunk_size: u32,
    pub chunk_count: u32,
    pub water_level: f32,
    pub world_bounds: [f32; 4],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScatterLayerMetadata {
    pub name: String,
    pub category: String,
    pub instance_count: u32,
    pub density: f32,
    pub distance_culling: f32,
}

