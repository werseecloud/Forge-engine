use crate::error::ShaderError;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct ShaderSource {
    pub path: PathBuf,
    pub source: String,
}

#[derive(Debug, Clone)]
pub struct ShaderLibrary {
    root: PathBuf,
}

impl Default for ShaderLibrary {
    fn default() -> Self {
        Self {
            root: PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("assets").join("shaders"),
        }
    }
}

impl ShaderLibrary {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn scan_default_library(&self) -> Result<Vec<ShaderSource>, ShaderError> {
        self.scan_wgsl_files()
    }

    pub fn scan_wgsl_files(&self) -> Result<Vec<ShaderSource>, ShaderError> {
        if !self.root.exists() {
            return Err(ShaderError::MissingFile(self.root.display().to_string()));
        }
        let mut shaders = Vec::new();
        for entry in fs::read_dir(&self.root).map_err(|error| ShaderError::Io(error.to_string()))? {
            let entry = entry.map_err(|error| ShaderError::Io(error.to_string()))?;
            let path = entry.path();
            if path.extension().and_then(|ext| ext.to_str()) == Some("wgsl") {
                shaders.push(Self::read_shader(&path)?);
            }
        }
        if shaders.is_empty() {
            return Err(ShaderError::MissingFile(format!("no WGSL shaders in {}", self.root.display())));
        }
        Ok(shaders)
    }

    pub fn read_shader(path: &Path) -> Result<ShaderSource, ShaderError> {
        if !path.exists() {
            return Err(ShaderError::MissingFile(path.display().to_string()));
        }
        let source = fs::read_to_string(path).map_err(|error| ShaderError::Io(error.to_string()))?;
        Ok(ShaderSource {
            path: path.to_path_buf(),
            source,
        })
    }

    pub fn create_shader_module(
        device: &wgpu::Device,
        shader: &ShaderSource,
    ) -> Result<wgpu::ShaderModule, ShaderError> {
        Ok(device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: shader.path.file_name().and_then(|name| name.to_str()),
            source: wgpu::ShaderSource::Wgsl(shader.source.clone().into()),
        }))
    }
}
