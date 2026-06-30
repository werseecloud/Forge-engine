use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum DebugView {
    Lit,
    Unlit,
    Albedo,
    Normals,
    Roughness,
    Metallic,
    Depth,
    MotionVectors,
    LightClusters,
    ShadowCascades,
    Wireframe,
    Overdraw,
    GpuTimings,
    PathTracingAccumulation,
}
