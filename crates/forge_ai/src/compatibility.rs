use crate::hardware_probe::HardwareProfile;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum DeviceTier {
    Low,
    Standard,
    High,
    Ultra,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecommendedModel {
    pub name: String,
    pub family: String,
    pub parameter_size: String,
    pub quantization: String,
    pub minimum_ram_gb: u32,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompatibilityReport {
    pub hardware: HardwareProfile,
    pub device_tier: DeviceTier,
    pub can_run_local_ai: bool,
    pub recommended_pack: String,
    pub recommended_models: Vec<RecommendedModel>,
    pub warnings: Vec<String>,
    pub minimum_disk_required_gb: u32,
    pub expected_performance: String,
}

pub fn assess(profile: HardwareProfile) -> AiCompatibilityReport {
    let tier = if profile.ram_gb >= 32 {
        DeviceTier::Ultra
    } else if profile.ram_gb >= 16 {
        DeviceTier::High
    } else if profile.ram_gb >= 8 {
        DeviceTier::Standard
    } else {
        DeviceTier::Low
    };
    let can_run =
        profile.ram_gb >= 4 && matches!(profile.architecture.as_str(), "x86_64" | "aarch64");
    let mut warnings = Vec::new();
    if profile.ram_gb < 8 {
        warnings.push("Use a 1B/3B/4B Q4 model; larger models may exhaust memory.".to_string());
    }
    if profile.gpu_name.is_none() {
        warnings.push(
            "No GPU was detected through Windows hardware query; CPU inference may be slower."
                .to_string(),
        );
    }
    if profile.battery_power == Some(true) {
        warnings.push("Large local models may be slow on battery power.".to_string());
    }
    let (pack, models, performance, disk) = match tier {
        DeviceTier::Low => (
            "Forge AI Lite",
            lite_models(),
            "Basic scene/script assistance, slower generation.",
            4,
        ),
        DeviceTier::Standard => (
            "Forge AI Standard",
            standard_models(),
            "Good offline assistant for editor tasks.",
            6,
        ),
        DeviceTier::High => (
            "Forge AI Advanced",
            advanced_models(),
            "Better local reasoning and code assistance.",
            10,
        ),
        DeviceTier::Ultra => (
            "Forge AI Ultra",
            ultra_models(),
            "Large model support if enough disk and cooling are available.",
            20,
        ),
    };
    AiCompatibilityReport {
        hardware: profile,
        device_tier: tier,
        can_run_local_ai: can_run,
        recommended_pack: pack.to_string(),
        recommended_models: models,
        warnings,
        minimum_disk_required_gb: disk,
        expected_performance: performance.to_string(),
    }
}

fn lite_models() -> Vec<RecommendedModel> {
    vec![model("Qwen 4B Q4", "qwen", "4B", "Q4", 4)]
}
fn standard_models() -> Vec<RecommendedModel> {
    vec![
        model("Qwen 4B Q5", "qwen", "4B", "Q5_0", 8),
        model("Phi Mini Q4", "phi", "3B", "Q4", 8),
    ]
}
fn advanced_models() -> Vec<RecommendedModel> {
    vec![
        model("Qwen 7B Q4", "qwen", "7B", "Q4", 16),
        model("Mistral 7B Q4", "mistral", "7B", "Q4", 16),
    ]
}
fn ultra_models() -> Vec<RecommendedModel> {
    vec![
        model("Qwen 14B Q4", "qwen", "14B", "Q4", 32),
        model(
            "DeepSeek Distill 14B Q4",
            "deepseek-distill",
            "14B",
            "Q4",
            32,
        ),
    ]
}
fn model(
    name: &str,
    family: &str,
    parameter_size: &str,
    quantization: &str,
    ram: u32,
) -> RecommendedModel {
    RecommendedModel {
        name: name.to_string(),
        family: family.to_string(),
        parameter_size: parameter_size.to_string(),
        quantization: quantization.to_string(),
        minimum_ram_gb: ram,
        notes: "Use GGUF local model files for offline inference.".to_string(),
    }
}
