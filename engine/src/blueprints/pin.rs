use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BlueprintDataType {
    Exec,
    Bool,
    Int,
    Float,
    String,
    Vec2,
    Vec3,
    Quat,
    Transform,
    Color,
    EntityRef,
    ComponentRef,
    AssetRef,
    SceneRef,
    AudioRef,
    Array,
    Map,
    Enum,
    Struct,
    Any,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PinDirection {
    Input,
    Output,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PinKind {
    Execution,
    Data,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlueprintPin {
    pub id: String,
    pub node_id: String,
    pub name: String,
    pub direction: PinDirection,
    pub kind: PinKind,
    pub data_type: BlueprintDataType,
    pub required: bool,
    pub allow_multiple: bool,
    pub description: String,
}
