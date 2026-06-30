use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClusteredForwardConfig {
    pub tile_size_px: u32,
    pub z_slices: u32,
    pub max_lights_per_cluster: u32,
    pub compute_required: bool,
}

impl Default for ClusteredForwardConfig {
    fn default() -> Self {
        Self {
            tile_size_px: 16,
            z_slices: 24,
            max_lights_per_cluster: 128,
            compute_required: true,
        }
    }
}
