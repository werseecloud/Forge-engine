# Backend Matrix

| Platform | Primary API | Current support | Planned high-end path |
| --- | --- | --- | --- |
| Windows | D3D12 through wgpu | Adapter/capability detection, headless worker health check | DXR/Vulkan RT abstraction, hybrid RT |
| Linux | Vulkan through wgpu | Capability detection when available | Vulkan RT extensions |
| macOS | Metal through wgpu | Capability detection when available | Metal compute fallback, Metal RT research |
| iOS/iPadOS | Metal | Mobile profiles only | Forward+ mobile renderer |
| Android | Vulkan | Mobile profiles only | Vulkan renderer, Vulkan RT capable tier |
| Browser | WebGPU | WGSL shader assets and type contracts | WASM/WebGPU demo with compute path tracing fallback |

The engine must gate every advanced option through `BackendCapabilities`. The editor disables RT toggles when hardware RT is unavailable.
