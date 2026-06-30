use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceNode {
    pub name: String,
    pub transient: bool,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PassNode {
    pub name: String,
    pub reads: Vec<String>,
    pub writes: Vec<String>,
    pub queue: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameGraph {
    pub passes: Vec<PassNode>,
    pub resources: BTreeMap<String, ResourceNode>,
}

impl FrameGraph {
    pub fn add_resource(&mut self, resource: ResourceNode) {
        self.resources.insert(resource.name.clone(), resource);
    }

    pub fn add_pass(&mut self, pass: PassNode) {
        for resource in pass.reads.iter().chain(pass.writes.iter()) {
            self.resources
                .entry(resource.clone())
                .or_insert(ResourceNode {
                    name: resource.clone(),
                    transient: true,
                    kind: "Texture".to_string(),
                });
        }
        self.passes.push(pass);
    }

    pub fn ordered_passes(&self) -> Vec<&PassNode> {
        let mut produced = BTreeSet::new();
        let mut remaining: Vec<_> = self.passes.iter().collect();
        let mut ordered = Vec::with_capacity(remaining.len());
        while !remaining.is_empty() {
            let before = remaining.len();
            let mut index = 0;
            while index < remaining.len() {
                let pass = remaining[index];
                if pass.reads.iter().all(|resource| {
                    produced.contains(resource) || self.resources.contains_key(resource)
                }) {
                    for resource in &pass.writes {
                        produced.insert(resource.clone());
                    }
                    ordered.push(pass);
                    remaining.remove(index);
                } else {
                    index += 1;
                }
            }
            if remaining.len() == before {
                ordered.extend(remaining);
                break;
            }
        }
        ordered
    }

    pub fn dump_json(&self) -> serde_json::Result<String> {
        serde_json::to_string_pretty(self)
    }
}
