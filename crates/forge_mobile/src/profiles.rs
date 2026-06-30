use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MobileGpuTier {
    Low,
    Mid,
    High,
    VulkanRtCapable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MobileQualityProfile {
    pub tier: MobileGpuTier,
    pub max_lights: u32,
    pub dynamic_resolution: bool,
    pub texture_compression: String,
    pub forward_plus: bool,
    pub hdr: bool,
}

impl MobileQualityProfile {
    pub fn for_tier(tier: MobileGpuTier) -> Self {
        match tier {
            MobileGpuTier::Low => Self {
                tier,
                max_lights: 16,
                dynamic_resolution: true,
                texture_compression: "ETC2".to_string(),
                forward_plus: true,
                hdr: false,
            },
            MobileGpuTier::Mid => Self {
                tier,
                max_lights: 48,
                dynamic_resolution: true,
                texture_compression: "ETC2/ASTC".to_string(),
                forward_plus: true,
                hdr: true,
            },
            MobileGpuTier::High => Self {
                tier,
                max_lights: 96,
                dynamic_resolution: true,
                texture_compression: "ASTC".to_string(),
                forward_plus: true,
                hdr: true,
            },
            MobileGpuTier::VulkanRtCapable => Self {
                tier,
                max_lights: 128,
                dynamic_resolution: true,
                texture_compression: "ASTC".to_string(),
                forward_plus: true,
                hdr: true,
            },
        }
    }
}
