# Graphics Features

Implemented foundation:

- Renderer path enum: Forward+, Deferred, Hybrid Ray Tracing, Path Tracing.
- Quality presets: Low, Medium, High, Ultra, Cinematic.
- Debug view enum for lit/unlit, material channels, depth, motion vectors, clusters, cascades, wireframe, overdraw and GPU timings.
- Standard PBR material data structure.
- Directional and point light data structures.
- Shadow, forward, tone map and bloom pass descriptors.

Partial:

- Existing renderer worker can initialize wgpu and run a headless command encoder.
- The editor has a working graphics settings modal backed by Rust commands.

Planned:

- Deferred G-buffer.
- SSAO/SSR/SSGI.
- Clustered light culling compute pass.
- HDR render target execution.
- Temporal anti-aliasing and upscaling.
- Virtual shadow maps style cache.
- Forge Virtual Geometry meshlet pipeline.
