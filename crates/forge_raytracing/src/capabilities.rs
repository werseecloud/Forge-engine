use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RayTracingTier {
    Unsupported,
    ComputeBvhFallback,
    HardwareRayQueries,
    HardwareRayTracingPipeline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RayTracingSupport {
    pub tier: RayTracingTier,
    pub reason: String,
    pub dxr_available: bool,
    pub vulkan_rt_available: bool,
    pub metal_rt_available: bool,
    pub compute_bvh_fallback_available: bool,
}

impl RayTracingSupport {
    pub fn unsupported(reason: impl Into<String>) -> Self {
        Self {
            tier: RayTracingTier::Unsupported,
            reason: reason.into(),
            dxr_available: false,
            vulkan_rt_available: false,
            metal_rt_available: false,
            compute_bvh_fallback_available: false,
        }
    }

    pub fn compute_fallback(reason: impl Into<String>) -> Self {
        Self {
            tier: RayTracingTier::ComputeBvhFallback,
            reason: reason.into(),
            dxr_available: false,
            vulkan_rt_available: false,
            metal_rt_available: false,
            compute_bvh_fallback_available: true,
        }
    }
}
