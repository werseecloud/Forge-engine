# Forge World Creator

Forge World Creator adds the first real world-generation workflow to the existing Forge Engine editor.

## Implemented

- `Add World` action in the World Outliner plus menu.
- Empty-scene viewport quick action for creating a world.
- Custom `Create New World` modal using Forge dark UI.
- Configurable:
  - world name
  - world type
  - map size
  - terrain resolution
  - seed
  - terrain height and mountain settings
  - roughness, erosion, noise and water level
  - standard Forge texture/PBR flags
  - material preset
  - scatter densities
  - performance quality options
- Rust/Tauri backend command `create_world`.
- Rust/Tauri backend command `discover_world_assets`.
- Real packaged world asset discovery from:
  - `engine/WorldAssets/Materials`
  - `engine/WorldAssets/Props`
  - `artifacts/windows/WorldAssets`
  - the user's Downloads folder during development
- Included local world assets:
  - `dirt_floor_8k.zip`
  - `rocky_terrain_02_8k.zip`
  - `snow_02_8k.zip`
  - `sandy_gravel_02_8k.zip`
  - `gray_big_rock.glb`
  - `low-poly-forest-tree-pack.zip`
- Material archive indexing for albedo, normal, roughness, AO, height/displacement and mask/ARM maps without extracting the full zip.
- Real project output under:
  - `Worlds/<WorldName>/world.forgeworld`
  - `Worlds/<WorldName>/terrain.heightmap`
  - `Worlds/<WorldName>/terrain.splatmap`
  - `Worlds/<WorldName>/world_config.json`
  - `Worlds/<WorldName>/materials/world_assets.json`
  - `Worlds/<WorldName>/scatter/scatter_layers.json`
  - `Worlds/<WorldName>/preview.txt`
- Seeded procedural heightmap generation.
- Material splat layer generation by height, slope, water and biome type.
- Scatter metadata for grass, rocks, foliage and flowers.
- Scatter layers reference real packaged prop assets when available.
- World scene entity with:
  - `WorldComponent`
  - `TerrainComponent`
  - `TerrainMaterialComponent`
  - `WorldScatterComponent`
  - `WorldPerformanceComponent`
  - `WaterComponent`
- World hierarchy display:
  - Terrain
  - Rocks
  - Grass
  - Foliage
  - Water
  - Lighting
  - Sky
  - World Settings
- World inspector summary for seed, map size, terrain, materials, scatter and performance.
- Viewport preview mesh for generated World entities.

## Viewport Navigation

Edit Mode scene preview now supports WASD navigation without entering Play Mode:

- `W/S`: move preview target forward/back.
- `A/D`: strafe preview target.
- `Shift`: faster movement.
- `Q/E`: vertical preview target movement.
- Right mouse or Alt-drag still orbits around the current preview target.

Keyboard navigation is ignored while typing into inputs, textareas or selects.

## Current Limitations

- World generation is a first vertical slice, not the final streaming terrain renderer.
- Heightmap and splatmap files are generated for real, but terrain chunk rendering still uses a preview mesh in the editor viewport.
- Built-in PBR material packs are discovered and linked from real archives. Custom external PBR texture file import slots are represented in config and UI, but user-selected import/optimization is a next step.
- Texture compression and mip generation are recorded in performance settings, but runtime optimized texture variants are planned.
- Scatter output is metadata and intended for instanced rendering; it does not spawn thousands of separate scene entities.
- Generation runs as one backend command. A future phase should add streamed progress/cancel events for very large worlds.

## Next Steps

- Async generation progress events and cancellation.
- Texture importer and optimizer for world PBR slots.
- Runtime terrain chunk mesh generation and LOD.
- Instanced scatter renderer buffers.
- World debug overlays for chunks, biome map, splat map and scatter density.
- Preset save/load commands.
- Tests for serialization, heightmap generation, scatter rules and modal validation.
