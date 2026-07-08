use crate::ai_errors::{AiError, AiResult};
use crate::model_loader::{copy_model_to_registry, metadata_for_model};
use crate::model_metadata::{ForgeModelMetadata, ModelStatus};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledModel {
    pub model_id: String,
    pub metadata: ForgeModelMetadata,
    pub model_path: String,
    pub metadata_path: String,
    pub size_bytes: u64,
    pub installed_at: String,
    pub active: bool,
    pub status: ModelStatus,
}

#[derive(Debug, Clone)]
pub struct ModelRegistry {
    pub root: PathBuf,
}

impl ModelRegistry {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn ai_root(&self) -> PathBuf {
        self.root.join("AI")
    }

    pub fn models_dir(&self) -> PathBuf {
        self.ai_root().join("Models")
    }

    pub fn settings_dir(&self) -> PathBuf {
        self.ai_root().join("Settings")
    }

    pub fn active_model_file(&self) -> PathBuf {
        self.settings_dir().join("active_model.json")
    }

    pub fn ensure_dirs(&self) -> AiResult<()> {
        for folder in [
            "Models",
            "ModelPacks",
            "Cache",
            "Conversations",
            "Logs",
            "Settings",
            "Tools",
        ] {
            fs::create_dir_all(self.ai_root().join(folder))?;
        }
        Ok(())
    }

    pub fn scan(&self) -> AiResult<Vec<InstalledModel>> {
        self.ensure_dirs()?;
        let active = self.read_active_model_id().ok();
        let mut models = Vec::new();
        for entry in WalkDir::new(self.models_dir())
            .max_depth(2)
            .into_iter()
            .filter_map(Result::ok)
        {
            let path = entry.path();
            if path
                .extension()
                .and_then(|ext| ext.to_str())
                .map(str::to_lowercase)
                .as_deref()
                != Some("gguf")
            {
                continue;
            }
            let metadata_path = path.with_extension("forgemodel");
            let metadata = if metadata_path.exists() {
                serde_json::from_slice(&fs::read(&metadata_path)?)?
            } else {
                let metadata = metadata_for_model(path)?;
                fs::write(&metadata_path, serde_json::to_vec_pretty(&metadata)?)?;
                metadata
            };
            let model_id = stable_model_id(path);
            let size_bytes = fs::metadata(path)?.len();
            let is_active = active.as_deref() == Some(&model_id);
            models.push(InstalledModel {
                model_id: model_id.clone(),
                metadata,
                model_path: path.to_string_lossy().to_string(),
                metadata_path: metadata_path.to_string_lossy().to_string(),
                size_bytes,
                installed_at: Utc::now().to_rfc3339(),
                active: is_active,
                status: ModelStatus {
                    model_id,
                    loaded: false,
                    loading: false,
                    health: "installed".to_string(),
                    memory_usage_mb: 0,
                    token_usage: 0,
                    error: None,
                },
            });
        }
        models.sort_by(|a, b| a.metadata.name.cmp(&b.metadata.name));
        Ok(models)
    }

    pub fn import_model(&self, source: &Path) -> AiResult<InstalledModel> {
        self.ensure_dirs()?;
        let destination = copy_model_to_registry(source, &self.models_dir())?;
        let metadata = metadata_for_model(&destination)?;
        let metadata_path = destination.with_extension("forgemodel");
        fs::write(&metadata_path, serde_json::to_vec_pretty(&metadata)?)?;
        self.scan()?
            .into_iter()
            .find(|model| Path::new(&model.model_path) == destination)
            .ok_or_else(|| AiError::ModelNotFound(destination.display().to_string()))
    }

    pub fn select_model(&self, model_id: &str) -> AiResult<InstalledModel> {
        let model = self
            .scan()?
            .into_iter()
            .find(|model| model.model_id == model_id)
            .ok_or_else(|| AiError::ModelNotFound(model_id.to_string()))?;
        fs::create_dir_all(self.settings_dir())?;
        fs::write(
            self.active_model_file(),
            serde_json::to_vec_pretty(&serde_json::json!({ "model_id": model_id }))?,
        )?;
        Ok(InstalledModel {
            active: true,
            ..model
        })
    }

    pub fn active_model(&self) -> AiResult<InstalledModel> {
        let active = self.read_active_model_id()?;
        self.scan()?
            .into_iter()
            .find(|model| model.model_id == active)
            .ok_or(AiError::NoActiveModel)
    }

    fn read_active_model_id(&self) -> AiResult<String> {
        let value: serde_json::Value =
            serde_json::from_slice(&fs::read(self.active_model_file())?)?;
        value
            .get("model_id")
            .and_then(|value| value.as_str())
            .map(str::to_string)
            .ok_or(AiError::NoActiveModel)
    }
}

fn stable_model_id(path: &Path) -> String {
    let name = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("model");
    format!(
        "model_{}_{}",
        sanitize(name),
        Uuid::new_v5(&Uuid::NAMESPACE_URL, path.to_string_lossy().as_bytes())
    )
}

fn sanitize(value: &str) -> String {
    value
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect()
}
