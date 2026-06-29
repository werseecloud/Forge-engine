use crate::renderer::stats::RenderStats;
use crate::scene::SceneSnapshot;
use crate::viewport::ViewportState;

#[derive(Debug, Clone)]
pub struct RendererState {
    pub viewport: ViewportState,
    pub scene: SceneSnapshot,
    pub stats: RenderStats,
    pub selected_entity: Option<String>,
}

impl Default for RendererState {
    fn default() -> Self {
        Self {
            viewport: ViewportState::default(),
            scene: SceneSnapshot::default_probe_scene(),
            stats: RenderStats::default(),
            selected_entity: None,
        }
    }
}
