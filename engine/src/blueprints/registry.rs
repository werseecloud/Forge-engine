use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::pin::BlueprintPin;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeDefinition {
    pub type_id: String,
    pub display_name: String,
    pub category: String,
    pub description: String,
    pub input_pins: Vec<BlueprintPin>,
    pub output_pins: Vec<BlueprintPin>,
    pub is_pure: bool,
    pub is_latent: bool,
    pub is_event: bool,
    pub runtime_handler_id: String,
    pub icon: String,
    pub color: String,
    pub keywords: Vec<String>,
}

#[derive(Default)]
pub struct NodeRegistry {
    definitions: HashMap<String, NodeDefinition>,
}

impl NodeRegistry {
    pub fn register(&mut self, definition: NodeDefinition) {
        self.definitions.insert(definition.type_id.clone(), definition);
    }

    pub fn get(&self, type_id: &str) -> Option<&NodeDefinition> {
        self.definitions.get(type_id)
    }
}
