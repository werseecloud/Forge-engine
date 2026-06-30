use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BvhBuildStats {
    pub primitive_count: u64,
    pub node_count: u64,
    pub build_time_ms: f32,
    pub backend: String,
}

#[derive(Debug, Default)]
pub struct ComputeBvhBuilder;

impl ComputeBvhBuilder {
    pub fn describe_fallback() -> &'static str {
        "Compute BVH fallback is planned for Milestone 3; hardware RT APIs are not exposed through current wgpu slice."
    }
}
