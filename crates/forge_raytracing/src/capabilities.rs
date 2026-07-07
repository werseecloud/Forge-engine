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

    pub fn hardware_ray_queries(reason: impl Into<String>, backend: &str) -> Self {
        Self {
            tier: RayTracingTier::HardwareRayQueries,
            reason: reason.into(),
            dxr_available: backend.eq_ignore_ascii_case("dx12"),
            vulkan_rt_available: backend.eq_ignore_ascii_case("vulkan"),
            metal_rt_available: backend.eq_ignore_ascii_case("metal"),
            compute_bvh_fallback_available: true,
        }
    }

    pub fn hardware_pipeline(reason: impl Into<String>, backend: &str) -> Self {
        Self {
            tier: RayTracingTier::HardwareRayTracingPipeline,
            reason: reason.into(),
            dxr_available: backend.eq_ignore_ascii_case("dx12"),
            vulkan_rt_available: backend.eq_ignore_ascii_case("vulkan"),
            metal_rt_available: backend.eq_ignore_ascii_case("metal"),
            compute_bvh_fallback_available: true,
        }
    }
}

impl Default for RayTracingSupport {
    fn default() -> Self {
        Self::unsupported("Ray tracing support has not been detected yet.")
    }
}
