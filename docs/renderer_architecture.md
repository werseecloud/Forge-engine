# Forge Renderer Architecture

Forge Renderer is split into explicit layers:

- `forge_core`: IDs, transforms, frame clock, profiling markers.
- `forge_rhi`: backend-neutral Render Hardware Interface contracts and wgpu capability detection.
- `forge_scene`: cameras, transforms, meshes, PBR materials, lights and sky settings.
- `forge_shader`: WGSL shader registry and pipeline cache metadata.
- `forge_renderer`: high-level renderer settings, frame graph, pass descriptors and GPU stats contracts.
- `forge_raytracing`: ray tracing/path tracing settings and fallback capability concepts.
- `forge_editor_bridge`: serializable commands/events used by the TypeScript editor.

Implemented now:

- wgpu adapter/capability detection.
- Serializable renderer settings and editor bridge commands.
- Frame graph pass/resource model with JSON dump.
- Baseline WGSL shader files for clear/fullscreen, forward PBR, shadow depth, tone mapping, bloom and compute path tracing placeholder output.

Not implemented yet:

- Surface-backed Rust viewport in the desktop editor window.
- Real GPU resource lifetime pooling.
- Hardware RT pipeline creation.
- Deferred G-buffer execution.
- Meshlet/virtual geometry.

The existing desktop editor currently renders its interactive viewport with Three.js. Rust owns renderer settings, capability reporting and worker startup; the Rust renderer runtime is being split into these crates.
