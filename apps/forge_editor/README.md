# Forge Editor

The current desktop editor is built from the repository root `src/` with Tauri configuration in `src-tauri/`.

This folder is reserved for the split editor package layout. The files under `apps/forge_editor/src` re-export the active editor graphics bridge/components so future package migration does not fork renderer UI contracts.
