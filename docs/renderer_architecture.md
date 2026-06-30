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

## Surface-Backed Rust Viewport

The target editor viewport is a native surface owned by Rust, embedded into the desktop editor window and driven by the renderer worker. TypeScript controls tools and sends scene/editor commands, but it does not own GPU resources or frame scheduling.

Responsibilities:

- Rust owns the `wgpu::Surface`, adapter, device, queue, swapchain configuration and render loop.
- Rust owns renderer state: camera, scene handles, loaded meshes, materials, lights, debug views and GPU statistics.
- TypeScript owns editor chrome: toolbar buttons, outliner selection, inspector inputs, modal UI and drag/drop intent.
- The bridge translates editor actions into renderer commands such as resize viewport, set camera, select object, set gizmo mode, load level, reload shaders and capture frame.

Window lifecycle:

1. Editor creates a viewport host region and reports its native window/viewport handle to Rust.
2. Rust creates or reconfigures a surface for that host.
3. Resize events call `resize_viewport(width, height)` and recreate depth/HDR targets.
4. Scene changes are queued as commands and applied before the next frame.
5. Rust renders into the surface and emits frame stats back to the editor.
6. If surface creation fails, the editor shows a real fallback/error panel instead of a fake viewport.

Minimum command contract:

```text
create_surface_viewport(window_handle, width, height)
resize_viewport(width, height)
set_viewport_camera(camera)
set_viewport_tool(select | move | rotate | scale)
set_debug_view(lit | unlit | albedo | normals | depth | wireframe)
load_scene(scene_path)
capture_viewport_frame(output_path)
destroy_surface_viewport()
```

Minimum event contract:

```text
ViewportReady(capabilities)
ViewportFrameStats(cpu_ms, gpu_ms, fps, draw_calls, triangles)
ViewportSelectionChanged(entity_id)
ViewportRenderError(message, recovery_action)
ViewportSurfaceLost(reason)
```

Implementation phases:

- Phase 1: standalone renderer worker owns a `wgpu` surface and can render the test scene in a native window.
- Phase 2: editor embeds or parents that surface into the viewport panel.
- Phase 3: TypeScript viewport toolbar drives Rust camera/debug/tool commands.
- Phase 4: scene objects, transforms and gizmos are rendered by Rust instead of Three.js.
- Phase 5: Three.js viewport is removed after feature parity and fallback error handling are proven.

Acceptance criteria:

- No WebGL/Three.js dependency for the production viewport.
- No fake rendered frame; the panel displays a real Rust-rendered swapchain frame.
- Resize, DPI scaling and surface-lost recovery are handled.
- Renderer stats come from Rust frame data.
- Missing GPU/backend support produces a visible error with recovery action.
