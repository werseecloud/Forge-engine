use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RenderGraphNode {
    pub id: String,
    pub display_name: String,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Default, Clone)]
pub struct RenderGraph {
    nodes: HashMap<String, RenderGraphNode>,
}

#[derive(Debug, Error)]
pub enum RenderGraphError {
    #[error("render graph node already exists: {0}")]
    DuplicateNode(String),
    #[error("render graph dependency is missing: {0}")]
    MissingDependency(String),
    #[error("render graph contains a cycle involving: {0}")]
    Cycle(String),
}

impl RenderGraph {
    pub fn add_node(&mut self, node: RenderGraphNode) -> Result<(), RenderGraphError> {
        if self.nodes.contains_key(&node.id) {
            return Err(RenderGraphError::DuplicateNode(node.id));
        }
        self.nodes.insert(node.id.clone(), node);
        Ok(())
    }

    pub fn topological_order(&self) -> Result<Vec<String>, RenderGraphError> {
        let mut order = Vec::new();
        let mut visiting = HashSet::new();
        let mut visited = HashSet::new();

        for id in self.nodes.keys() {
            self.visit(id, &mut visiting, &mut visited, &mut order)?;
        }

        Ok(order)
    }

    fn visit(
        &self,
        id: &str,
        visiting: &mut HashSet<String>,
        visited: &mut HashSet<String>,
        order: &mut Vec<String>,
    ) -> Result<(), RenderGraphError> {
        if visited.contains(id) {
            return Ok(());
        }
        if !self.nodes.contains_key(id) {
            return Err(RenderGraphError::MissingDependency(id.to_string()));
        }
        if !visiting.insert(id.to_string()) {
            return Err(RenderGraphError::Cycle(id.to_string()));
        }

        let node = self.nodes.get(id).expect("node checked above");
        for dep in &node.dependencies {
            self.visit(dep, visiting, visited, order)?;
        }
        visiting.remove(id);
        visited.insert(id.to_string());
        order.push(id.to_string());
        Ok(())
    }
}
