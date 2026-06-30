# Forge Mobile Demo

Planned Android/iOS integration target.

Current status:
- Mobile GPU quality profiles live in `crates/forge_mobile`.
- Android target: Vulkan first, OpenGL ES only as legacy fallback.
- iOS/iPadOS target: Metal through the RHI abstraction.
- Mobile viewport target: Rust owns the native surface, swapchain, frame loop and renderer state. The platform shell only creates the host view and forwards resize/touch/input events.

No mobile app package is shipped yet.
