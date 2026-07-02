use super::{graph::BlueprintGraph, ir::BlueprintIr};

#[derive(Debug, Clone)]
pub struct CompiledBlueprint {
    pub graph_id: String,
    pub ir: BlueprintIr,
    pub warnings: Vec<String>,
}

pub fn compile_blueprint(graph: &BlueprintGraph) -> CompiledBlueprint {
    CompiledBlueprint {
        graph_id: graph.id.clone(),
        ir: BlueprintIr {
            graph_id: graph.id.clone(),
            entry_nodes: graph
                .nodes
                .iter()
                .filter(|node| node.type_id.starts_with("event."))
                .map(|node| node.id.clone())
                .collect(),
            nodes: graph
                .nodes
                .iter()
                .map(|node| super::ir::BlueprintIrNode {
                    id: node.id.clone(),
                    type_id: node.type_id.clone(),
                    properties: node.properties.clone(),
                })
                .collect(),
            execution_edges: graph
                .edges
                .iter()
                .filter(|edge| edge.edge_type == "execution")
                .map(|edge| (edge.from_node_id.clone(), edge.to_node_id.clone()))
                .collect(),
        },
        warnings: Vec::new(),
    }
}
