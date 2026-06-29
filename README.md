# Forge Engine

Forge Engine is a Windows desktop editor shell built with Tauri v2, Rust, React, TypeScript, and Vite.

## What Works

- Native Windows desktop window with a custom Forge Engine title bar.
- Project creation with real folders and metadata files.
- Project opening from a real `ForgeProject.forge` manifest.
- Recent project persistence in `%AppData%/ForgeEngine/settings.json`.
- Content Browser from the real project `Content` folder.
- Asset import by copying local files into the project folder.
- Sidecar asset metadata files: `*.forge_meta`.
- Asset index rebuilds in `.forge/asset_index.json`.
- Real `.forge_scene` level files with world layers and scene objects.
- Canvas viewport with measured FPS and a real editor grid.
- Drag imported assets into the viewport to create scene objects.
- Inspector editing for real assets and scene objects.
- Output log persistence in `%LocalAppData%/ForgeEngine/Logs/editor.log`.

The UI intentionally shows empty states when no real project, level, asset, or scene object exists.

## Run In Development

```powershell
npm install
npm run tauri:dev
```

## Build Windows EXE

```powershell
npm run tauri:build
```

Build outputs:

- Runtime EXE: `src-tauri/target/release/forge_engine_editor.exe`
- Installer EXE: `src-tauri/target/release/bundle/nsis/Forge Engine_1.0.0_x64-setup.exe`
- Committed installer copy: `artifacts/windows/Forge Engine_1.0.0_x64-setup.exe`

## GitHub Repository

Remote target:

```text
https://github.com/werseecloud/Forge-engine.git
```

