# Forge Editor

The current desktop editor is built from the repository root `src/` with Tauri configuration in `src-tauri/`.

This folder is reserved for the split editor package layout. The files under `apps/forge_editor/src` re-export the active editor graphics bridge/components so future package migration does not fork renderer UI contracts.

## Viewport Target

The production viewport target is a surface-backed Rust renderer, not a browser-owned WebGL viewport. The current editor keeps the TypeScript UI shell active while Rust renderer ownership is being split into `forge_rhi`, `forge_renderer`, `forge_scene` and `forge_editor_bridge`.

Implementation details and acceptance criteria are tracked in `docs/renderer_architecture.md`.
