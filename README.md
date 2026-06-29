# Forge Engine Setup

## No Mock Audit

Installer areas that are often mocked and how this code replaces them with real behavior:

- System checks: `run_system_check` reads the real OS, CPU architecture, AppData/Documents paths, disk availability, permissions, existing install files, WebView2 registry keys, and component source availability.
- Component list: `scan_available_components` scans real build outputs under `apps/*/target/{release,debug}`, repository `target/{release,debug}`, `apps/*/dist`, and `apps/*/src-tauri/target/release`. Missing required binaries block installation.
- Component sizes: sizes are calculated from the actual source files on disk.
- Install paths: path validation attempts real directory creation and test writes, and warns when Program Files needs elevated permissions.
- Project folder: validation checks the real selected path, write access, disk space, and whether it conflicts with the install directory.
- Progress: `run_install_plan` emits progress events only after real operations complete: folder creation, binary copies, manifest/settings writes, shortcuts, associations, and health checks.
- Health checks: installed binaries are verified from disk, then run with `--health-check`, falling back to `--version` only as a warning path.
- Existing install detection: reads real `manifest.json` and `version.json` from the selected/default install path.
- Settings and installer state: written to the real roaming ForgeEngine folder.
- Logs: every operation writes to the real local installer log.
- Shortcuts and associations: implemented as real filesystem/registry-backed operations where permissions allow; failures are shown and logged instead of treated as success.
- Completion: the success screen is only reachable after the backend install and health check commands finish successfully.

Forge Engine Setup is a Windows desktop installer built with Tauri v2, Rust, React, TypeScript, and Vite.

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
- Three.js viewport with measured FPS and a local procedural 3D environment.
- Drag imported assets into the viewport to create scene objects.
- Inspector editing for real assets and scene objects.
- Output log persistence in `%LocalAppData%/ForgeEngine/Logs/editor.log`.

The UI intentionally shows empty states when no real project, level, asset, or scene object exists.

## Local Engine Content

The installer supports large local content packs. Put real content under:

- `engine/StarterContent`
- `engine/Shaders`
- `engine/Templates`
- `engine/Runtime`
- `docs`
- `licenses`

These folders are scanned at runtime, sized from disk, listed as real optional components, and copied into the install folder when selected. This means Forge Engine can grow into multi-GB local installs without changing installer code.

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

- Setup app EXE: `target/release/forge_installer.exe`
- Installer EXE: `target/release/bundle/nsis/Forge Engine Setup_1.0.0_x64-setup.exe`
- Committed installer copy: `artifacts/windows/Forge Engine Setup_1.0.0_x64-setup.exe`

## GitHub Repository

Remote target:

```text
https://github.com/werseecloud/Forge-engine.git
```
