use crate::error::RendererError;
use crate::render_graph::pass_context::PassContext;

pub trait RenderPass {
    fn name(&self) -> &str;
    fn prepare(&mut self, _context: &mut PassContext) -> Result<(), RendererError> { Ok(()) }
    fn execute(&mut self, _context: &mut PassContext) -> Result<(), RendererError>;
    fn cleanup(&mut self, _context: &mut PassContext) -> Result<(), RendererError> { Ok(()) }
}
