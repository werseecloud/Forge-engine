use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudProviderConfig {
    pub provider_name: String,
    pub endpoint_url: String,
    pub model_name: String,
    pub api_key_configured: bool,
}
