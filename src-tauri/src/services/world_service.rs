use anyhow::{anyhow, Result};
use chrono::Utc;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::scene::{SceneComponent, SceneObject, Transform, Vec3};
use crate::models::world::{
    CreateWorldRequest, CreateWorldResult, ForgeWorldFile, MapSize, QualityMode,
    ScatterLayerMetadata, TerrainOutputMetadata, WorldConfig, WorldMaterialLayer, WorldType,
};
use crate::services::{log_service, scene_service};
use crate::utils::ids::new_id;
use crate::utils::paths::{ensure_within, sanitize_file_stem, write_json_pretty};

pub fn create_world(request: CreateWorldRequest) -> Result<CreateWorldResult> {
    let project_root = PathBuf::from(&request.project_root);
    if !project_root.exists() {
        return Err(anyhow!("Project root does not exist: {}", project_root.display()));
    }
    let mut level = scene_service::open_level(request.project_root.clone(), request.level_path)?;
    let safe_name = sanitize_file_stem(&request.config.world_name);
    let worlds_root = project_root.join("Worlds");
    fs::create_dir_all(&worlds_root)?;
    let world_root = ensure_within(&worlds_root, &worlds_root.join(&safe_name))?;
    for folder in ["materials", "scatter", "cache"] {
        fs::create_dir_all(world_root.join(folder))?;
    }

    let map_size = resolve_map_size(&request.config);
    let sample_resolution = request.config.terrain_resolution.clamp(33, 4097);
    let heightmap = generate_heightmap(&request.config, sample_resolution, map_size);
    let splatmap = generate_splatmap(&heightmap, &request.config, sample_resolution);

    let heightmap_path = world_root.join("terrain.heightmap");
    let splatmap_path = world_root.join("terrain.splatmap");
    write_f32_binary(&heightmap_path, &heightmap)?;
    write_u8_binary(&splatmap_path, &splatmap)?;

    let scatter_layers = generate_scatter_layers(&request.config, map_size);
    let world_id = new_id("world");
    let chunk_size = choose_chunk_size(sample_resolution);
    let chunk_count = ((sample_resolution as f32 / chunk_size as f32).ceil() as u32).pow(2);
    let world_file = ForgeWorldFile {
        file_type: "forge_world".to_string(),
        name: request.config.world_name.clone(),
        world_id: world_id.clone(),
        seed: request.config.seed,
        map_size,
        terrain_resolution: sample_resolution,
        max_height: request.config.terrain.max_height,
        mountain_height: request.config.terrain.mountain_height,
        performance_mode: request.config.performance.texture_quality.clone(),
        materials: material_layers_for_config(&request.config),
        scatter_layers: scatter_layers.clone(),
        terrain: TerrainOutputMetadata {
            heightmap_path: heightmap_path.to_string_lossy().to_string(),
            splatmap_path: splatmap_path.to_string_lossy().to_string(),
            sample_resolution,
            chunk_size,
            chunk_count,
            water_level: request.config.terrain.water_level,
            world_bounds: [
                -(map_size as f32) * 0.5,
                -(map_size as f32) * 0.5,
                (map_size as f32) * 0.5,
                (map_size as f32) * 0.5,
            ],
        },
        created_with: "Forge World Creator".to_string(),
    };

    let world_file_path = world_root.join("world.forgeworld");
    write_json_pretty(&world_file_path, &world_file)?;
    write_json_pretty(&world_root.join("world_config.json"), &request.config)?;
    write_json_pretty(&world_root.join("scatter/scatter_layers.json"), &scatter_layers)?;
    fs::write(
        world_root.join("preview.txt"),
        format!(
            "Forge World Preview\nName: {}\nSeed: {}\nGenerated: {}\n",
            request.config.world_name,
            request.config.seed,
            Utc::now().to_rfc3339()
        ),
    )?;

    let world_object = make_world_scene_object(&request.config, &world_file, &world_file_path);
    level.objects.push(world_object);
    let saved = scene_service::save_level(request.project_root.clone(), level)?;
    log_service::append_output_log(&format!(
        "Generated world '{}' at {}",
        world_file.name,
        world_root.display()
    ))?;

    let warnings = collect_world_warnings(&request.config);
    Ok(CreateWorldResult {
        world: world_file,
        level: saved,
        generated_files: vec![
            world_file_path.to_string_lossy().to_string(),
            heightmap_path.to_string_lossy().to_string(),
            splatmap_path.to_string_lossy().to_string(),
            world_root.join("world_config.json").to_string_lossy().to_string(),
            world_root.join("scatter/scatter_layers.json").to_string_lossy().to_string(),
            world_root.join("preview.txt").to_string_lossy().to_string(),
        ],
        warnings,
    })
}

fn make_world_scene_object(config: &WorldConfig, world: &ForgeWorldFile, world_file_path: &Path) -> SceneObject {
    SceneObject {
        id: new_id("entity"),
        name: "World".to_string(),
        tags: vec!["world".to_string(), "terrain".to_string(), format!("{:?}", config.world_type).to_lowercase()],
        layer: None,
        visible: true,
        asset_reference: Some(world_file_path.to_string_lossy().to_string()),
        transform: Some(Transform {
            position: Vec3 { x: 0.0, y: 0.0, z: 0.0 },
            rotation: Vec3 { x: 0.0, y: 0.0, z: 0.0 },
            scale: Vec3 { x: 1.0, y: 1.0, z: 1.0 },
        }),
        components: vec![
            SceneComponent {
                component_type: "WorldComponent".to_string(),
                data: serde_json::json!({
                    "worldId": world.world_id,
                    "name": world.name,
                    "seed": world.seed,
                    "mapSize": world.map_size,
                    "worldFile": world_file_path.to_string_lossy().to_string()
                }),
            },
            SceneComponent {
                component_type: "TerrainComponent".to_string(),
                data: serde_json::json!({
                    "resolution": world.terrain_resolution,
                    "heightmap": world.terrain.heightmap_path,
                    "splatmap": world.terrain.splatmap_path,
                    "maxHeight": world.max_height,
                    "mountainHeight": world.mountain_height,
                    "chunkSize": world.terrain.chunk_size,
                    "chunkCount": world.terrain.chunk_count
                }),
            },
            SceneComponent {
                component_type: "TerrainMaterialComponent".to_string(),
                data: serde_json::json!({
                    "preset": config.textures.terrain_material_preset,
                    "usePbr": config.textures.use_pbr_textures,
                    "layers": world.materials
                }),
            },
            SceneComponent {
                component_type: "WorldScatterComponent".to_string(),
                data: serde_json::json!({
                    "layers": world.scatter_layers,
                    "instancing": true,
                    "densityMultiplier": config.performance.object_density_multiplier
                }),
            },
            SceneComponent {
                component_type: "WorldPerformanceComponent".to_string(),
                data: serde_json::json!({
                    "auto": config.performance.auto_detect_pc_performance,
                    "textureQuality": config.performance.texture_quality,
                    "terrainLod": config.performance.terrain_lod,
                    "streaming": config.performance.streaming,
                    "occlusionCulling": config.performance.occlusion_culling
                }),
            },
            SceneComponent {
                component_type: "WaterComponent".to_string(),
                data: serde_json::json!({
                    "enabled": config.terrain.water_level > 0.0,
                    "waterLevel": config.terrain.water_level
                }),
            },
        ],
    }
}

fn generate_heightmap(config: &WorldConfig, resolution: u32, map_size: u32) -> Vec<f32> {
    let mut values = Vec::with_capacity((resolution * resolution) as usize);
    let half = resolution as f32 * 0.5;
    let spawn_radius = (resolution as f32 * 0.055).max(4.0);
    for z in 0..resolution {
        for x in 0..resolution {
            let nx = (x as f32 - half) / half;
            let nz = (z as f32 - half) / half;
            let distance = (nx * nx + nz * nz).sqrt();
            let base = layered_noise(nx, nz, config.seed, config.terrain.noise_scale.max(0.1));
            let mountain = (1.0 - distance).max(0.0).powf(2.4) * config.terrain.mountain_height;
            let hills = base * config.terrain.hill_strength * config.terrain.max_height;
            let valley = ((nx * 2.7 + nz.sin()).sin().abs() * config.terrain.valley_depth).min(config.terrain.max_height);
            let mut height = match config.world_type {
                WorldType::EmptyWorld => 0.0,
                WorldType::Grassland => hills * 0.35,
                WorldType::Mountains | WorldType::RockyValley => mountain + hills - valley,
                WorldType::Forest => hills * 0.55 + mountain * 0.18,
                WorldType::Desert => hills * 0.25 + dune_noise(nx, nz, config.seed) * config.terrain.max_height * 0.32,
                WorldType::Snow => mountain * 0.8 + hills * 0.45,
                WorldType::Island => (1.0 - distance).max(0.0).powf(1.1) * (mountain * 0.35 + hills),
                WorldType::ProceduralMixedWorld => mountain * 0.55 + hills - valley * 0.45,
            };
            height *= 1.0 - config.terrain.erosion.clamp(0.0, 1.0) * 0.32;
            if config.terrain.flat_spawn_area {
                let dx = x as f32 - half;
                let dz = z as f32 - half;
                let spawn_blend = ((dx * dx + dz * dz).sqrt() / spawn_radius).clamp(0.0, 1.0);
                height *= smoothstep(spawn_blend);
            }
            if matches!(config.world_type, WorldType::Island) {
                height -= distance.powf(2.0) * config.terrain.max_height * 0.45;
            }
            let meters_per_sample = map_size as f32 / resolution.max(1) as f32;
            values.push((height.max(-config.terrain.water_level) * meters_per_sample.sqrt().max(1.0)).max(-100.0));
        }
    }
    values
}

fn generate_splatmap(heightmap: &[f32], config: &WorldConfig, resolution: u32) -> Vec<u8> {
    let mut values = Vec::with_capacity(heightmap.len());
    for z in 0..resolution {
        for x in 0..resolution {
            let index = (z * resolution + x) as usize;
            let height = heightmap[index];
            let right = heightmap.get((z * resolution + (x + 1).min(resolution - 1)) as usize).copied().unwrap_or(height);
            let up = heightmap.get(((z + 1).min(resolution - 1) * resolution + x) as usize).copied().unwrap_or(height);
            let slope = ((right - height).abs() + (up - height).abs()) * 0.5;
            let layer = if height < config.terrain.water_level {
                4
            } else if slope > 18.0 {
                2
            } else if height > config.terrain.mountain_height * 0.6 && matches!(config.world_type, WorldType::Snow | WorldType::Mountains) {
                3
            } else if matches!(config.world_type, WorldType::Desert) {
                5
            } else {
                1
            };
            values.push(layer);
        }
    }
    values
}

fn generate_scatter_layers(config: &WorldConfig, map_size: u32) -> Vec<ScatterLayerMetadata> {
    let area_scale = (map_size as f32 / 512.0).powi(2);
    let density_multiplier = config.performance.object_density_multiplier.max(0.0);
    let quality_scale = match config.performance.grass_quality {
        QualityMode::Low => 0.35,
        QualityMode::Medium => 0.65,
        QualityMode::High => 1.0,
        QualityMode::Ultra => 1.35,
        QualityMode::Auto => 0.85,
    };
    vec![
        scatter("Grass", "grass", config.environment.grass_density, area_scale, density_multiplier * quality_scale, config.performance.foliage_distance),
        scatter("Rocks", "rocks", config.environment.rock_density, area_scale, density_multiplier, config.performance.foliage_distance * 0.8),
        scatter("Foliage", "foliage", config.environment.tree_density + config.environment.bush_density, area_scale, density_multiplier * 0.55, config.performance.foliage_distance),
        scatter("Flowers", "flowers", config.environment.flower_density, area_scale, density_multiplier * 0.45, config.performance.foliage_distance * 0.55),
    ]
}

fn scatter(name: &str, category: &str, density: f32, area_scale: f32, multiplier: f32, distance: f32) -> ScatterLayerMetadata {
    ScatterLayerMetadata {
        name: name.to_string(),
        category: category.to_string(),
        instance_count: (density.max(0.0) * area_scale * multiplier).round().clamp(0.0, 250_000.0) as u32,
        density,
        distance_culling: distance,
    }
}

fn material_layers_for_config(config: &WorldConfig) -> Vec<WorldMaterialLayer> {
    if !config.textures.pbr_layers.is_empty() {
        return config.textures.pbr_layers.clone();
    }
    let preset = config.textures.terrain_material_preset.clone();
    let names = match config.world_type {
        WorldType::Desert => ["Sand", "Dry Rock", "Cracked Dirt", "Gravel"],
        WorldType::Snow => ["Snow", "Ice", "Frozen Rock", "Dirt"],
        WorldType::Forest => ["Moss", "Grass", "Mud", "Leaves"],
        WorldType::Mountains | WorldType::RockyValley => ["Rock", "Cliff", "Gravel", "Snow"],
        _ => ["Grass", "Dirt", "Rock", "Gravel"],
    };
    names
        .iter()
        .enumerate()
        .map(|(index, name)| WorldMaterialLayer {
            name: (*name).to_string(),
            albedo_texture: Some(format!("forge://world_textures/{preset}/{}_albedo", name.to_lowercase().replace(' ', "_"))),
            normal_texture: Some(format!("forge://world_textures/{preset}/{}_normal", name.to_lowercase().replace(' ', "_"))),
            roughness_texture: Some(format!("forge://world_textures/{preset}/{}_roughness", name.to_lowercase().replace(' ', "_"))),
            metallic_texture: None,
            ao_texture: None,
            height_texture: None,
            mask_map: None,
            tiling: 4.0 + index as f32,
            strength: 1.0,
            height_min: index as f32 * 0.2,
            height_max: 1.0,
            slope_min: if index == 2 { 0.35 } else { 0.0 },
            slope_max: 1.0,
            biome_mask: Some(format!("{:?}", config.world_type)),
        })
        .collect()
}

fn collect_world_warnings(config: &WorldConfig) -> Vec<String> {
    let mut warnings = Vec::new();
    if config.terrain_resolution > 2049 && matches!(config.performance.terrain_lod, QualityMode::Low | QualityMode::Medium | QualityMode::Auto) {
        warnings.push("High terrain resolution with non-Ultra LOD may generate a large heightmap.".to_string());
    }
    if !config.textures.use_standard_forge_textures && config.textures.pbr_layers.is_empty() {
        warnings.push("No standard textures or custom PBR layers were selected; fallback material layers were generated.".to_string());
    }
    warnings
}

fn resolve_map_size(config: &WorldConfig) -> u32 {
    match config.map_size {
        MapSize::Small => 512,
        MapSize::Medium => 1024,
        MapSize::Large => 2048,
        MapSize::Huge => 4096,
        MapSize::Custom => config.custom_map_size.unwrap_or(1024).clamp(128, 8192),
    }
}

fn choose_chunk_size(resolution: u32) -> u32 {
    if resolution >= 2049 {
        257
    } else if resolution >= 1025 {
        129
    } else {
        65
    }
}

fn write_f32_binary(path: &Path, values: &[f32]) -> Result<()> {
    let mut bytes = Vec::with_capacity(values.len() * 4);
    for value in values {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    fs::write(path, bytes)?;
    Ok(())
}

fn write_u8_binary(path: &Path, values: &[u8]) -> Result<()> {
    fs::write(path, values)?;
    Ok(())
}

fn layered_noise(x: f32, z: f32, seed: u32, scale: f32) -> f32 {
    let mut amplitude = 1.0;
    let mut frequency = scale;
    let mut total = 0.0;
    let mut norm = 0.0;
    for octave in 0..5 {
        total += value_noise(x * frequency, z * frequency, seed.wrapping_add(octave * 31)) * amplitude;
        norm += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    total / norm.max(0.0001)
}

fn dune_noise(x: f32, z: f32, seed: u32) -> f32 {
    ((x * 13.0 + value_noise(x, z, seed) * 4.0).sin() * 0.5 + (z * 4.0).cos() * 0.25).abs()
}

fn value_noise(x: f32, z: f32, seed: u32) -> f32 {
    let xi = (x * 127.1).floor() as i32;
    let zi = (z * 311.7).floor() as i32;
    let xf = x * 127.1 - xi as f32;
    let zf = z * 311.7 - zi as f32;
    let a = hash_noise(xi, zi, seed);
    let b = hash_noise(xi + 1, zi, seed);
    let c = hash_noise(xi, zi + 1, seed);
    let d = hash_noise(xi + 1, zi + 1, seed);
    let u = smoothstep(xf);
    let v = smoothstep(zf);
    lerp(lerp(a, b, u), lerp(c, d, u), v) * 2.0 - 1.0
}

fn hash_noise(x: i32, z: i32, seed: u32) -> f32 {
    let mut n = (x as u32).wrapping_mul(374761393)
        ^ (z as u32).wrapping_mul(668265263)
        ^ seed.wrapping_mul(2246822519);
    n = (n ^ (n >> 13)).wrapping_mul(1274126177);
    ((n ^ (n >> 16)) as f32) / u32::MAX as f32
}

fn smoothstep(t: f32) -> f32 {
    let t = t.clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}
