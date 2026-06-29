use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ResourceHandle {
    pub id: Uuid,
    pub type_name: String,
    pub debug_name: String,
}

impl ResourceHandle {
    pub fn new(type_name: impl Into<String>, debug_name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            type_name: type_name.into(),
            debug_name: debug_name.into(),
        }
    }
}
