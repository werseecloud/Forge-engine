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
}

impl RayTracingSupport {
    pub fn unsupported(reason: impl Into<String>) -> Self {
        Self {
            tier: RayTracingTier::Unsupported,
            reason: reason.into(),
        }
    }
}
