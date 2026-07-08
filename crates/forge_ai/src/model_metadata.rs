use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ModelFormat {
    Gguf,
    Safetensors,
    Onnx,
    ForgePack,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgeModelMetadata {
    pub model_type: String,
    pub name: String,
    pub family: String,
    pub format: ModelFormat,
    pub quantization: String,
    pub parameter_size: String,
    pub context_length: u32,
    pub recommended_ram_gb: u32,
    pub recommended_vram_gb: u32,
    pub offline: bool,
    pub supports_tools: bool,
    pub supports_code: bool,
    pub supports_scene_editing: bool,
    pub model_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub model_id: String,
    pub loaded: bool,
    pub loading: bool,
    pub health: String,
    pub memory_usage_mb: u64,
    pub token_usage: u64,
    pub error: Option<String>,
}

impl ForgeModelMetadata {
    pub fn for_gguf(file_name: &str) -> Self {
        let lower = file_name.to_lowercase();
        let family = if lower.contains("qwen") {
            "qwen"
        } else if lower.contains("gemma") {
            "gemma"
        } else if lower.contains("llama") {
            "llama"
        } else if lower.contains("mistral") {
            "mistral"
        } else if lower.contains("phi") {
            "phi"
        } else if lower.contains("deepseek") {
            "deepseek-distill"
        } else {
            "custom"
        };
        let quantization = lower
            .split(['-', '_'])
            .find(|part| part.starts_with('q') && part.chars().any(|c| c.is_ascii_digit()))
            .unwrap_or("unknown")
            .to_uppercase();
        let parameter_size = lower
            .split(['-', '_'])
            .find(|part| part.ends_with('b') && part.chars().any(|c| c.is_ascii_digit()))
            .unwrap_or("unknown")
            .to_uppercase();
        Self {
            model_type: "forge_ai_model".to_string(),
            name: file_name.trim_end_matches(".gguf").replace(['_', '-'], " "),
            family: family.to_string(),
            format: ModelFormat::Gguf,
            quantization,
            parameter_size,
            context_length: 8192,
            recommended_ram_gb: 8,
            recommended_vram_gb: 0,
            offline: true,
            supports_tools: true,
            supports_code: true,
            supports_scene_editing: true,
            model_file: format!("models/{file_name}"),
        }
    }
}
