use crate::render_graph::{RenderGraph, RenderGraphError};

pub fn schedule(graph: &RenderGraph) -> Result<Vec<String>, RenderGraphError> {
    graph.topological_order()
}
