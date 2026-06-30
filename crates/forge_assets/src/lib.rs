use serde::{Deserialize, Serialize};
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AssetError {
    #[error("asset file does not exist: {0}")]
    Missing(String),
    #[error("gltf import failed: {0}")]
    Gltf(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GltfAssetSummary {
    pub source_path: String,
    pub mesh_count: usize,
    pub material_count: usize,
    pub texture_count: usize,
    pub animation_count: usize,
}

pub fn inspect_gltf_or_glb(path: impl AsRef<Path>) -> Result<GltfAssetSummary, AssetError> {
    let path = path.as_ref();
    if !path.exists() {
        return Err(AssetError::Missing(path.display().to_string()));
    }
    #[cfg(feature = "gltf_import")]
    {
        let document =
            gltf::Gltf::open(path).map_err(|error| AssetError::Gltf(error.to_string()))?;
        Ok(GltfAssetSummary {
            source_path: path.display().to_string(),
            mesh_count: document.meshes().count(),
            material_count: document.materials().count(),
            texture_count: document.textures().count(),
            animation_count: document.animations().count(),
        })
    }
    #[cfg(not(feature = "gltf_import"))]
    {
        Ok(GltfAssetSummary {
            source_path: path.display().to_string(),
            mesh_count: 0,
            material_count: 0,
            texture_count: 0,
            animation_count: 0,
        })
    }
}
