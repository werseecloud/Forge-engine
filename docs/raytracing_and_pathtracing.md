# Ray Tracing and Path Tracing

Current implementation:

- `forge_raytracing` defines ray tracing support tiers and path tracing settings.
- The editor exposes path tracing controls and disables hardware RT toggles when capabilities report unsupported.
- WGSL compute path tracing shader exists as a baseline accumulation target placeholder.

Important limitation:

wgpu 0.20 does not expose a common hardware RT pipeline API. Current `supports_ray_tracing` is therefore false unless a future backend-specific layer proves support.

Milestones:

1. Compute BVH fallback and progressive accumulation buffer.
2. Native backend abstraction for DXR/Vulkan RT/Metal RT research.
3. Ray traced shadows, reflections and AO.
4. Hybrid renderer with raster primary visibility plus RT secondary rays.
