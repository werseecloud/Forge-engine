use crate::ai_errors::{AiError, AiResult};
use crate::model_metadata::ForgeModelMetadata;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

pub fn validate_gguf(path: &Path) -> AiResult<()> {
    let mut file = fs::File::open(path)?;
    let mut magic = [0_u8; 4];
    file.read_exact(&mut magic)?;
    if &magic != b"GGUF" {
        return Err(AiError::InvalidModel(format!(
            "{} does not start with GGUF magic bytes",
            path.display()
        )));
    }
    Ok(())
}

pub fn metadata_for_model(path: &Path) -> AiResult<ForgeModelMetadata> {
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| AiError::InvalidModel("model file has no valid name".to_string()))?;
    if path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(str::to_lowercase)
        .as_deref()
        != Some("gguf")
    {
        return Err(AiError::UnsupportedModelFormat(file_name.to_string()));
    }
    validate_gguf(path)?;
    Ok(ForgeModelMetadata::for_gguf(file_name))
}

pub fn copy_model_to_registry(source: &Path, models_dir: &Path) -> AiResult<PathBuf> {
    fs::create_dir_all(models_dir)?;
    let file_name = source
        .file_name()
        .ok_or_else(|| AiError::InvalidModel("model file has no file name".to_string()))?;
    let destination = models_dir.join(file_name);
    if source != destination {
        fs::copy(source, &destination)?;
    }
    Ok(destination)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_gguf_magic_bytes() {
        let path = std::env::temp_dir().join(format!("forge_ai_test_{}.gguf", std::process::id()));
        fs::write(&path, b"GGUF\x03\0\0\0").unwrap();
        assert!(validate_gguf(&path).is_ok());
        fs::remove_file(path).ok();
    }
}
