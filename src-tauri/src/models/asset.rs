use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetMetadata {
    pub asset_id: String,
    pub file_name: String,
    pub relative_path: String,
    pub asset_type: String,
    pub file_size: u64,
    pub extension: String,
    pub imported_at: String,
    pub modified_at: String,
    pub source_path_hash: String,
    pub thumbnail_path: Option<String>,
    pub tags: Vec<String>,
    pub import_settings: serde_json::Value,
    pub dependencies: Vec<String>,
    pub engine_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIndex {
    pub project_root: String,
    pub rebuilt_at: String,
    pub assets: Vec<AssetMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportAssetsRequest {
    pub project_root: String,
    pub source_paths: Vec<String>,
    pub destination_relative: String,
    pub conflict_strategy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: Vec<AssetMetadata>,
    pub skipped: Vec<String>,
    pub errors: Vec<String>,
}

