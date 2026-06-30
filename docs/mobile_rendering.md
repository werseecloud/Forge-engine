# Mobile Rendering

Current implementation:

- `forge_mobile` defines low, mid, high and Vulkan RT capable tiers.
- Profiles include texture compression strategy, dynamic resolution, light limits and HDR support.

Renderer strategy:

- Forward+ first.
- Dynamic resolution enabled by default.
- ASTC on high-end mobile, ETC2 fallback on Android.
- Avoid desktop-only assumptions such as large bindless arrays or high light counts.

Planned:

- Android Vulkan demo.
- iOS Metal demo.
- Tile-based GPU friendly render pass layout.
