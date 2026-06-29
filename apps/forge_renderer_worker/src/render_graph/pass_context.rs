use crate::renderer::backend::FrameContext;
use crate::renderer::stats::RenderStats;

#[derive(Debug, Clone)]
pub struct PassContext {
    pub frame: FrameContext,
    pub stats: RenderStats,
}
