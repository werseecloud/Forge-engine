use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ShaderError {
    #[error("shader module not found: {0}")]
    NotFound(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShaderStage {
    Vertex,
    Fragment,
    Compute,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShaderModuleDesc {
    pub name: String,
    pub path: String,
    pub stage: ShaderStage,
    pub source_hash: String,
    pub entry_point: String,
    pub permutation_key: Option<String>,
}

#[derive(Debug, Default)]
pub struct ShaderRegistry {
    modules: BTreeMap<String, ShaderModuleDesc>,
}

impl ShaderRegistry {
    pub fn register_wgsl(
        &mut self,
        name: impl Into<String>,
        path: impl Into<String>,
        stage: ShaderStage,
        source: &str,
        entry_point: impl Into<String>,
    ) -> ShaderModuleDesc {
        let desc = ShaderModuleDesc {
            name: name.into(),
            path: path.into(),
            stage,
            source_hash: hash_source(source),
            entry_point: entry_point.into(),
            permutation_key: None,
        };
        self.modules.insert(desc.name.clone(), desc.clone());
        desc
    }

    pub fn get(&self, name: &str) -> Result<&ShaderModuleDesc, ShaderError> {
        self.modules
            .get(name)
            .ok_or_else(|| ShaderError::NotFound(name.to_string()))
    }

    pub fn modules(&self) -> impl Iterator<Item = &ShaderModuleDesc> {
        self.modules.values()
    }
}

fn hash_source(source: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(source.as_bytes());
    format!("{:x}", hasher.finalize())
}
