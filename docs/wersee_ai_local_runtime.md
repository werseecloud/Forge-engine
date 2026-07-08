# Wersee AI for Forge - Local AI Infrastructure

Wersee AI adds offline-first local AI infrastructure to Forge Engine.

## Implemented

- New `forge_ai` Rust crate.
- GGUF model validation using real `GGUF` magic bytes.
- Local model registry under `Documents/Forge Engine/AI/`.
- Bundled model discovery/copy from:
  - `engine/AI/Models`
  - `artifacts/windows/AI/Models`
  - installed app `AI/Models`
- `.forgemodel` metadata support.
- Hardware compatibility probe for OS, architecture, CPU, RAM and GPU name where Windows reports it.
- Device tier recommendation:
  - Low
  - Standard
  - High
  - Ultra
- Optional installer component: `Forge AI Standard Local Model Pack`.
- Local model supported during packaging:
  - `Qwen3-4B-Q5_0.gguf`
- Tauri commands for:
  - device probe
  - model list/import/select/load/status
  - context building
  - action proposal
  - permissions
  - logs
- Custom Wersee AI modal in the editor.
- Header AI menu and top toolbar AI button.
- `Ctrl+I` shortcut.
- Local-only/offline permission mode defaults.
- Safe action proposals for:
  - scene edits
  - world setting changes
  - Blueprint node creation
  - Forge Script fixes
  - playable character setup
- Scene-aware AI context:
  - active level path, layers and scene objects
  - selected entity and Inspector data
  - project asset index summaries
  - active Blueprint graph nodes, edges, variables and diagnostics
- Blueprint AI sidebar for generating complete Blueprint graphs from the current scene/project context.
- Real action application after explicit user confirmation:
  - scene object transform/component edits are written back to the active `.forge_scene`
  - Forge Script drafts are written as `.forge` files inside the project
  - Blueprint graphs can be created in `Content/Blueprints`
  - world preset files can be written inside the project
- Local GGUF inference runner adapter:
  - detects `forge_ai_runner.exe` or `llama-cli.exe` from `AI/Runtime`
  - also supports `FORGE_AI_RUNNER` / `FORGE_AI_LLAMA_CLI`
  - sends the selected GGUF model and a prompt file to the local runner
  - uses no Ollama process and no cloud/API provider

## Runtime Status

The runtime is local-only by default. It never calls Ollama and never sends project context to cloud unless a future cloud mode is explicitly enabled.

Text generation works when a local runner is installed in:

`AI/Runtime/`

Supported runner names:

- `forge_ai_runner.exe`
- `llama-cli.exe`
- `llama-run.exe`
- `main.exe`

If no local runner is present, Forge returns a clear runner-missing error and still allows safe local tool planning. It does not fake LLM output.

Planned embedded backend adapters:

- llama.cpp
- llama-cpp-rs
- candle
- future GPU runtime

## Safety

- Offline/local-only mode is enabled by default.
- Cloud/API fallback is disabled by default.
- AI actions return structured proposed changes with operation and payload fields.
- Code-changing actions require the user to click Apply before files are changed.
- All file writes are constrained to the active project root.

## Installer/Artifact Packaging

The build artifact includes AI model content under:

`artifacts/windows/AI/Models/`

The installer exposes `Forge AI Standard Local Model Pack` as optional content and copies `engine/AI` to the install `ai` folder when selected.

The provided `Qwen3-4B-Q5_0.gguf` file is larger than GitHub's single LFS object limit. Keep it locally at:

- `engine/AI/Models/Qwen3-4B-Q5_0.gguf`
- `artifacts/windows/AI/Models/Qwen3-4B-Q5_0.gguf`

The build script copies the local file into the artifact when present. The `.forgemodel` metadata is tracked in Git.
