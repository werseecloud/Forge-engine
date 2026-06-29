# Forge Renderer Worker

`forge_renderer_worker.exe` is the local Forge Engine rendering worker. It is a real Rust/wgpu binary used by the installer, editor, and health checks.

## Commands

```powershell
forge_renderer_worker.exe --version
forge_renderer_worker.exe --health-check
forge_renderer_worker.exe --standalone
forge_renderer_worker.exe --ipc-port 49870
```

`--health-check` initializes `wgpu`, requests a real GPU adapter/device, scans the bundled WGSL shader library, and prints JSON. It does not report success when GPU setup fails.

## IPC

When started with `--ipc-port`, the worker listens on `127.0.0.1:<port>` and accepts newline-delimited JSON commands:

- `{"type":"ping"}`
- `{"type":"request_render_stats"}`
- `{"type":"resize_viewport","width":1280,"height":720}`
- `{"type":"render_frame"}`
- `{"type":"reload_shaders"}`
- `{"type":"shutdown"}`

Responses are newline-delimited JSON events.
