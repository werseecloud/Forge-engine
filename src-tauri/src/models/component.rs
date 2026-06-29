use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallerComponent {
    pub id: String,
    pub display_name: String,
    pub binary_name: String,
    pub required: bool,
    pub optional: bool,
    pub selected: bool,
    pub available: bool,
    pub size_bytes: u64,
    pub source_path: Option<String>,
    pub destination_path: String,
    pub error: Option<String>,
}

