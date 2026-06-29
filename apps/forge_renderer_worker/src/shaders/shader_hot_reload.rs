use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ShaderHotReloadConfig {
    pub enabled: bool,
    pub shader_dir: PathBuf,
}
