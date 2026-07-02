use anyhow::Result;

use super::graph::BlueprintGraph;

pub fn read_graph_json(source: &str) -> Result<BlueprintGraph> {
    Ok(serde_json::from_str(source)?)
}

pub fn write_graph_json(graph: &BlueprintGraph) -> Result<String> {
    Ok(serde_json::to_string_pretty(graph)?)
}
