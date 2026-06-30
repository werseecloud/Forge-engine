use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceHandle(pub u32);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ResourceKind {
    Buffer,
    Texture,
    Sampler,
    BindGroup,
    RenderPipeline,
    ComputePipeline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceDesc {
    pub handle: ResourceHandle,
    pub kind: ResourceKind,
    pub label: String,
    pub transient: bool,
}
