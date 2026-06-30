# Editor Bridge

The TypeScript editor talks to Rust through Tauri commands:

- `get_backend_capabilities`
- `get_renderer_settings`
- `update_renderer_settings`
- `get_gpu_stats`
- `reset_path_tracing_accumulation`

Shared Rust command/event schemas live in `crates/forge_editor_bridge`.

The frontend does not own renderer state. It edits serializable settings and sends them to Rust. Rust validates settings against backend capabilities before persisting them.
