pub mod gpu_bind_group;
pub mod gpu_buffer;
pub mod gpu_pipeline;
pub mod gpu_sampler;
pub mod gpu_texture;
pub mod resource_cache;
pub mod resource_handle;

use crate::error::ResourceError;
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct ResourceRegistry<T> {
    resources: HashMap<String, T>,
}

impl<T> ResourceRegistry<T> {
    pub fn insert(&mut self, id: String, value: T) -> Result<(), ResourceError> {
        if self.resources.contains_key(&id) {
            return Err(ResourceError::Duplicate(id));
        }
        self.resources.insert(id, value);
        Ok(())
    }

    pub fn get(&self, id: &str) -> Result<&T, ResourceError> {
        self.resources
            .get(id)
            .ok_or_else(|| ResourceError::NotFound(id.to_string()))
    }
}
