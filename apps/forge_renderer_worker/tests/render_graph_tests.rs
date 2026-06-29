use forge_renderer_worker::render_graph::{RenderGraph, RenderGraphNode};

#[test]
fn graph_orders_dependencies_before_consumers() {
    let mut graph = RenderGraph::default();
    graph
        .add_node(RenderGraphNode {
            id: "geometry".to_string(),
            display_name: "Geometry".to_string(),
            dependencies: vec![],
        })
        .unwrap();
    graph
        .add_node(RenderGraphNode {
            id: "lighting".to_string(),
            display_name: "Lighting".to_string(),
            dependencies: vec!["geometry".to_string()],
        })
        .unwrap();

    assert_eq!(graph.topological_order().unwrap(), vec!["geometry", "lighting"]);
}

#[test]
fn graph_rejects_cycles() {
    let mut graph = RenderGraph::default();
    graph
        .add_node(RenderGraphNode {
            id: "a".to_string(),
            display_name: "A".to_string(),
            dependencies: vec!["b".to_string()],
        })
        .unwrap();
    graph
        .add_node(RenderGraphNode {
            id: "b".to_string(),
            display_name: "B".to_string(),
            dependencies: vec!["a".to_string()],
        })
        .unwrap();

    assert!(graph.topological_order().is_err());
}
