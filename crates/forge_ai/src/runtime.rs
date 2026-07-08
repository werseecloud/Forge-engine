use crate::ai_errors::{AiError, AiResult};
use crate::inference::{AiGenerationResult, AiPrompt, GenerateOptions};
use crate::jobs::AiJobId;
use crate::model_metadata::ModelStatus;
use crate::model_registry::InstalledModel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeModelHandle {
    pub model_id: String,
    pub backend: String,
    pub loaded: bool,
}

pub trait LocalAiRuntime {
    fn load_model(&mut self, model: InstalledModel) -> AiResult<RuntimeModelHandle>;
    fn unload_model(&mut self, model_id: &str) -> AiResult<()>;
    fn generate(
        &mut self,
        prompt: AiPrompt,
        options: GenerateOptions,
    ) -> AiResult<AiGenerationResult>;
    fn cancel(&mut self, job_id: AiJobId) -> AiResult<()>;
    fn get_model_status(&self, model_id: &str) -> ModelStatus;
}

#[derive(Default)]
pub struct RuntimeManager {
    loaded_models: HashMap<String, InstalledModel>,
}

impl LocalAiRuntime for RuntimeManager {
    fn load_model(&mut self, model: InstalledModel) -> AiResult<RuntimeModelHandle> {
        self.loaded_models
            .insert(model.model_id.clone(), model.clone());
        Ok(RuntimeModelHandle {
            model_id: model.model_id,
            backend: "metadata-only".to_string(),
            loaded: false,
        })
    }

    fn unload_model(&mut self, model_id: &str) -> AiResult<()> {
        self.loaded_models.remove(model_id);
        Ok(())
    }

    fn generate(
        &mut self,
        _prompt: AiPrompt,
        _options: GenerateOptions,
    ) -> AiResult<AiGenerationResult> {
        Err(AiError::BackendUnavailable(
            "No llama.cpp/candle inference backend is linked in this Forge build. Model management, context building and safe action proposals are available.".to_string(),
        ))
    }

    fn cancel(&mut self, _job_id: AiJobId) -> AiResult<()> {
        Ok(())
    }

    fn get_model_status(&self, model_id: &str) -> ModelStatus {
        ModelStatus {
            model_id: model_id.to_string(),
            loaded: false,
            loading: false,
            health: if self.loaded_models.contains_key(model_id) {
                "backend-unavailable"
            } else {
                "not-loaded"
            }
            .to_string(),
            memory_usage_mb: 0,
            token_usage: 0,
            error: Some("Inference backend is not linked yet.".to_string()),
        }
    }
}
