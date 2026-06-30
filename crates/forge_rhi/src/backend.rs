use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum BackendApi {
    WebGpu,
    Vulkan,
    D3d12,
    Metal,
    OpenGl,
    OpenGlEs,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BackendPreference {
    HighPerformance,
    LowPower,
    BrowserSafe,
}

impl Default for BackendPreference {
    fn default() -> Self {
        Self::HighPerformance
    }
}

#[cfg(feature = "webgpu")]
impl From<wgpu::Backend> for BackendApi {
    fn from(value: wgpu::Backend) -> Self {
        match value {
            wgpu::Backend::Vulkan => Self::Vulkan,
            wgpu::Backend::Dx12 => Self::D3d12,
            wgpu::Backend::Metal => Self::Metal,
            wgpu::Backend::Gl => Self::OpenGl,
            wgpu::Backend::BrowserWebGpu => Self::WebGpu,
            _ => Self::Unknown,
        }
    }
}
