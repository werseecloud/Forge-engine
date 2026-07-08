use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectAiIndex {
    pub root: String,
    pub forge_files: usize,
    pub blueprint_files: usize,
    pub scene_files: usize,
    pub asset_files: usize,
}

pub fn index_project(root: &Path) -> ProjectAiIndex {
    let mut index = ProjectAiIndex {
        root: root.to_string_lossy().to_string(),
        forge_files: 0,
        blueprint_files: 0,
        scene_files: 0,
        asset_files: 0,
    };
    for entry in WalkDir::new(root)
        .max_depth(5)
        .into_iter()
        .filter_map(Result::ok)
    {
        let extension = entry
            .path()
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("");
        match extension {
            "forge" => index.forge_files += 1,
            "forgeblueprint" | "blueprint" => index.blueprint_files += 1,
            "forge_scene" | "forgeworld" => index.scene_files += 1,
            "glb" | "gltf" | "png" | "jpg" | "hdr" => index.asset_files += 1,
            _ => {}
        }
    }
    index
}
