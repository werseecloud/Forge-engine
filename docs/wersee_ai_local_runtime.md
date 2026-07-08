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

## Runtime Status

The current runtime is metadata/tool-router only. It does not fake LLM text generation.

If the user asks for a generated text response, Forge returns a clear backend-unavailable error until a native inference backend is linked.

Planned backend adapters:

- llama.cpp
- llama-cpp-rs
- candle
- future GPU runtime

## Safety

- Offline/local-only mode is enabled by default.
- Cloud/API fallback is disabled by default.
- AI actions return structured proposed changes.
- Destructive or code-changing actions require confirmation before host systems apply them.

## Installer/Artifact Packaging

The build artifact includes AI model content under:

`artifacts/windows/AI/Models/`

The installer exposes `Forge AI Standard Local Model Pack` as optional content and copies `engine/AI` to the install `ai` folder when selected.

The provided `Qwen3-4B-Q5_0.gguf` file is larger than GitHub's single LFS object limit. Keep it locally at:

- `engine/AI/Models/Qwen3-4B-Q5_0.gguf`
- `artifacts/windows/AI/Models/Qwen3-4B-Q5_0.gguf`

The build script copies the local file into the artifact when present. The `.forgemodel` metadata is tracked in Git.
