use super::graph::BlueprintGraph;

pub fn validate_blueprint(graph: &BlueprintGraph) -> Vec<String> {
    let mut errors = Vec::new();
    if graph.nodes.is_empty() {
        errors.push("Graph has no nodes.".to_string());
    }
    errors
}
