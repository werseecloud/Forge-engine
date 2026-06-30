use forge_raytracing::PathTracingSettings;
use forge_rhi::BackendCapabilities;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RendererPath {
    ForwardPlus,
    Deferred,
    HybridRayTracing,
    PathTracing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum QualityPreset {
    Low,
    Medium,
    High,
    Ultra,
    Cinematic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicsSettings {
    pub renderer_path: RendererPath,
    pub quality_preset: QualityPreset,
    pub ray_traced_shadows: bool,
    pub ray_traced_reflections: bool,
    pub ray_traced_ao: bool,
    pub ray_traced_gi: bool,
    pub path_tracing: PathTracingSettings,
    pub gi_mode: String,
    pub shadow_quality: String,
    pub reflection_quality: String,
    pub volumetric_quality: String,
    pub dynamic_resolution: bool,
    pub resolution_scale: f32,
    pub texture_budget_mb: u32,
    pub max_lights: u32,
    pub vsync: bool,
    pub frame_limiter: Option<u32>,
    pub debug_view: crate::debug_views::DebugView,
}

impl Default for GraphicsSettings {
    fn default() -> Self {
        Self {
            renderer_path: RendererPath::ForwardPlus,
            quality_preset: QualityPreset::High,
            ray_traced_shadows: false,
            ray_traced_reflections: false,
            ray_traced_ao: false,
            ray_traced_gi: false,
            path_tracing: PathTracingSettings::default(),
            gi_mode: "Probes".to_string(),
            shadow_quality: "High".to_string(),
            reflection_quality: "ScreenSpace".to_string(),
            volumetric_quality: "Medium".to_string(),
            dynamic_resolution: false,
            resolution_scale: 1.0,
            texture_budget_mb: 4096,
            max_lights: 256,
            vsync: true,
            frame_limiter: None,
            debug_view: crate::debug_views::DebugView::Lit,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuStats {
    pub frame_index: u64,
    pub frame_time_ms: f32,
    pub cpu_time_ms: f32,
    pub gpu_time_ms: Option<f32>,
    pub draw_calls: u32,
    pub triangle_count: u64,
    pub visible_objects: u32,
    pub light_count: u32,
    pub vram_estimate_mb: u32,
    pub shader_compilations: u32,
    pub pipeline_cache_hits: u64,
    pub pipeline_cache_misses: u64,
    pub backend_name: String,
    pub adapter_name: Option<String>,
}

pub struct ForgeRenderer {
    settings: GraphicsSettings,
    capabilities: BackendCapabilities,
    stats: GpuStats,
}

impl ForgeRenderer {
    pub fn new(capabilities: BackendCapabilities) -> Self {
        Self {
            settings: GraphicsSettings::default(),
            capabilities,
            stats: GpuStats::default(),
        }
    }

    pub fn settings(&self) -> &GraphicsSettings {
        &self.settings
    }

    pub fn set_settings(&mut self, mut settings: GraphicsSettings) {
        if !self.capabilities.supports_ray_tracing {
            settings.ray_traced_shadows = false;
            settings.ray_traced_reflections = false;
            settings.ray_traced_ao = false;
            settings.ray_traced_gi = false;
            if matches!(settings.renderer_path, RendererPath::HybridRayTracing) {
                settings.renderer_path = RendererPath::Deferred;
            }
        }
        self.settings = settings;
    }

    pub fn stats(&self) -> GpuStats {
        self.stats.clone()
    }
}
