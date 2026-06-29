use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledComponentManifest {
    pub display_name: String,
    pub version: String,
    pub path: String,
    pub required: bool,
    pub size_bytes: u64,
    pub health_check: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallManifest {
    pub engine_name: String,
    pub engine_version: String,
    pub install_id: String,
    pub installed_at: String,
    pub install_path: String,
    pub bin_path: String,
    pub default_projects_dir: String,
    pub components: BTreeMap<String, InstalledComponentManifest>,
    pub folders: BTreeMap<String, String>,
}

