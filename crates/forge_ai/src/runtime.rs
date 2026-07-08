use crate::ai_errors::{AiError, AiResult};
use crate::inference::{AiGenerationResult, AiPrompt, GenerateOptions};
use crate::jobs::AiJobId;
use crate::model_metadata::ModelStatus;
use crate::model_registry::InstalledModel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use uuid::Uuid;

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
    loaded_models: HashMap<String, LoadedRuntimeModel>,
}

#[derive(Clone)]
struct LoadedRuntimeModel {
    model: InstalledModel,
    runner_path: Option<PathBuf>,
    token_usage: u64,
}

impl LocalAiRuntime for RuntimeManager {
    fn load_model(&mut self, model: InstalledModel) -> AiResult<RuntimeModelHandle> {
        let runner_path = find_local_runner();
        let backend = runner_path
            .as_ref()
            .map(|path| format!("forge-local-runner:{}", path.display()))
            .unwrap_or_else(|| "forge-local-runner-missing".to_string());
        self.loaded_models.insert(
            model.model_id.clone(),
            LoadedRuntimeModel {
                model: model.clone(),
                runner_path: runner_path.clone(),
                token_usage: 0,
            },
        );
        Ok(RuntimeModelHandle {
            model_id: model.model_id,
            backend,
            loaded: runner_path.is_some(),
        })
    }

    fn unload_model(&mut self, model_id: &str) -> AiResult<()> {
        self.loaded_models.remove(model_id);
        Ok(())
    }

    fn generate(
        &mut self,
        prompt: AiPrompt,
        options: GenerateOptions,
    ) -> AiResult<AiGenerationResult> {
        let model_id = self
            .loaded_models
            .keys()
            .next()
            .cloned()
            .ok_or(AiError::NoActiveModel)?;
        let loaded = self
            .loaded_models
            .get_mut(&model_id)
            .ok_or(AiError::NoActiveModel)?;
        let runner_path = loaded.runner_path.clone().ok_or_else(|| {
            AiError::BackendUnavailable(
                "Forge local AI runner was not found. Place forge_ai_runner.exe or llama-cli.exe in AI/Runtime, or set FORGE_AI_RUNNER to a local GGUF runner. No cloud/Ollama provider was used.".to_string(),
            )
        })?;
        let prompt_text = format_prompt(&prompt);
        let output = run_local_runner(
            &runner_path,
            Path::new(&loaded.model.model_path),
            &prompt_text,
            &options,
        )?;
        let prompt_tokens = estimate_tokens(&prompt_text);
        let completion_tokens = estimate_tokens(&output);
        loaded.token_usage += completion_tokens;
        Ok(AiGenerationResult {
            job_id: Uuid::new_v4().to_string(),
            text: output,
            finish_reason: "completed".to_string(),
            prompt_tokens,
            completion_tokens,
            model_id: Some(model_id),
            warnings: Vec::new(),
        })
    }

    fn cancel(&mut self, _job_id: AiJobId) -> AiResult<()> {
        Ok(())
    }

    fn get_model_status(&self, model_id: &str) -> ModelStatus {
        let loaded = self.loaded_models.get(model_id);
        ModelStatus {
            model_id: model_id.to_string(),
            loaded: loaded.and_then(|item| item.runner_path.as_ref()).is_some(),
            loading: false,
            health: loaded
                .map(|item| {
                    if item.runner_path.is_some() {
                        "ready"
                    } else {
                        "runner-missing"
                    }
                })
                .unwrap_or("not-loaded")
                .to_string(),
            memory_usage_mb: loaded
                .map(|item| item.model.size_bytes / 1024 / 1024)
                .unwrap_or(0),
            token_usage: loaded.map(|item| item.token_usage).unwrap_or(0),
            error: loaded.and_then(|item| {
                if item.runner_path.is_some() {
                    None
                } else {
                    Some("Forge local AI runner was not found in AI/Runtime.".to_string())
                }
            }),
        }
    }
}

fn format_prompt(prompt: &AiPrompt) -> String {
    let mut text = String::new();
    text.push_str("<|system|>\n");
    text.push_str(prompt.system.trim());
    text.push_str("\n\nYou are running fully local inside Forge Engine. Never claim that a file or scene was changed unless a Forge tool action applied it.\n");
    if let Some(context) = &prompt.context {
        text.push_str("\n<|context|>\n");
        text.push_str(context.trim());
        text.push('\n');
    }
    text.push_str("\n<|user|>\n");
    text.push_str(prompt.user.trim());
    text.push_str("\n<|assistant|>\n");
    text
}

fn run_local_runner(
    runner_path: &Path,
    model_path: &Path,
    prompt_text: &str,
    options: &GenerateOptions,
) -> AiResult<String> {
    if !runner_path.exists() {
        return Err(AiError::BackendUnavailable(format!(
            "local AI runner was not found: {}",
            runner_path.display()
        )));
    }
    if !model_path.exists() {
        return Err(AiError::ModelNotFound(model_path.display().to_string()));
    }
    let prompt_file = std::env::temp_dir().join(format!("forge_ai_prompt_{}.txt", Uuid::new_v4()));
    fs::write(&prompt_file, prompt_text)?;

    let mut command = Command::new(runner_path);
    let file_name = runner_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or_default()
        .to_lowercase();
    let max_tokens = options.max_tokens.clamp(1, 4096).to_string();
    let temperature = options.temperature.clamp(0.0, 2.0).to_string();

    if file_name.contains("forge_ai_runner") {
        command
            .arg("--model")
            .arg(model_path)
            .arg("--prompt-file")
            .arg(&prompt_file)
            .arg("--max-tokens")
            .arg(&max_tokens)
            .arg("--temperature")
            .arg(&temperature);
    } else {
        command
            .arg("-m")
            .arg(model_path)
            .arg("-f")
            .arg(&prompt_file)
            .arg("-n")
            .arg(&max_tokens)
            .arg("--temp")
            .arg(&temperature)
            .arg("--no-display-prompt");
    }

    let output = command.output()?;
    let _ = fs::remove_file(&prompt_file);
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if !output.status.success() {
        return Err(AiError::BackendUnavailable(format!(
            "local AI runner failed with status {}: {}",
            output.status,
            if stderr.is_empty() { stdout } else { stderr }
        )));
    }
    if stdout.is_empty() {
        return Err(AiError::BackendUnavailable(format!(
            "local AI runner returned no text{}",
            if stderr.is_empty() {
                String::new()
            } else {
                format!(": {stderr}")
            }
        )));
    }
    Ok(stdout)
}

fn find_local_runner() -> Option<PathBuf> {
    let mut candidates = Vec::new();
    for key in ["FORGE_AI_RUNNER", "FORGE_AI_LLAMA_CLI"] {
        if let Ok(path) = std::env::var(key) {
            let path = PathBuf::from(path);
            if path.is_dir() {
                candidates.extend(runner_names().into_iter().map(|name| path.join(name)));
            } else {
                candidates.push(path);
            }
        }
    }
    if let Ok(current) = std::env::current_dir() {
        for root in [
            current.join("AI/Runtime"),
            current.join("engine/AI/Runtime"),
            current.join("artifacts/windows/AI/Runtime"),
        ] {
            candidates.extend(runner_names().into_iter().map(|name| root.join(name)));
        }
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            for root in [
                parent.join("AI/Runtime"),
                parent.join("ai/runtime"),
                parent.join("engine/AI/Runtime"),
            ] {
                candidates.extend(runner_names().into_iter().map(|name| root.join(name)));
            }
        }
    }
    candidates.into_iter().find(|path| path.is_file())
}

fn runner_names() -> Vec<&'static str> {
    if cfg!(windows) {
        vec![
            "forge_ai_runner.exe",
            "llama-cli.exe",
            "llama-run.exe",
            "main.exe",
        ]
    } else {
        vec!["forge_ai_runner", "llama-cli", "llama-run", "main"]
    }
}

fn estimate_tokens(text: &str) -> u64 {
    ((text.split_whitespace().count() as f64) * 1.35).ceil() as u64
}
