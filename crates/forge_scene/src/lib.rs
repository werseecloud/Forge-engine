pub mod camera;
pub mod lights;
pub mod material;
pub mod mesh;

use forge_core::{EntityId, Transform};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneObject {
    pub id: EntityId,
    pub name: String,
    pub transform: Transform,
    pub mesh: Option<mesh::MeshHandle>,
    pub material: Option<material::MaterialHandle>,
    pub visible: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderScene {
    pub cameras: Vec<camera::Camera>,
    pub objects: Vec<SceneObject>,
    pub directional_lights: Vec<lights::DirectionalLight>,
    pub point_lights: Vec<lights::PointLight>,
    pub sky: lights::SkySettings,
}
