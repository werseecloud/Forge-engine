use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineKey {
    pub renderer_path: String,
    pub pass_name: String,
    pub shader: String,
    pub material_variant: String,
    pub sample_count: u32,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineCacheStats {
    pub warmed_pipelines: usize,
    pub misses: u64,
    pub hits: u64,
}

#[derive(Debug, Default)]
pub struct PipelineCacheIndex {
    keys: BTreeSet<PipelineKey>,
    stats: PipelineCacheStats,
}

impl PipelineCacheIndex {
    pub fn warm(&mut self, key: PipelineKey) {
        if self.keys.insert(key) {
            self.stats.warmed_pipelines = self.keys.len();
            self.stats.misses += 1;
        } else {
            self.stats.hits += 1;
        }
    }

    pub fn stats(&self) -> PipelineCacheStats {
        self.stats.clone()
    }
}
