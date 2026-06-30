use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshHandle(pub Uuid);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshMetadata {
    pub name: String,
    pub vertex_count: u32,
    pub index_count: u32,
    pub primitive_count: u32,
    pub has_tangents: bool,
    pub has_skinning: bool,
    pub has_morph_targets: bool,
}
