# Performance Budget

Initial budgets:

- 16.6 ms frame target for 60 FPS.
- CPU render submission under 3 ms for medium scenes.
- GPU forward path under 10 ms on mid-range desktop.
- Shader compilation off the frame path.
- No unbounded per-frame allocations in renderer core.

Stats contracts now include:

- CPU/GPU frame time.
- Draw calls.
- Triangle count.
- Visible object count.
- Light count.
- VRAM estimate.
- Shader and pipeline cache stats.

Planned profiling:

- Timestamp query capture when supported.
- Frame graph resource lifetime dump.
- RenderDoc labels and capture metadata.
