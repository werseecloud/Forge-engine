use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPrompt {
    pub system: String,
    pub user: String,
    pub context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateOptions {
    pub max_tokens: u32,
    pub temperature: f32,
    pub stream: bool,
    pub local_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerationResult {
    pub job_id: String,
    pub text: String,
    pub finish_reason: String,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub model_id: Option<String>,
    pub warnings: Vec<String>,
}

impl Default for GenerateOptions {
    fn default() -> Self {
        Self {
            max_tokens: 512,
            temperature: 0.4,
            stream: false,
            local_only: true,
        }
    }
}
