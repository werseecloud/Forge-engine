use std::collections::HashMap;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(Debug, Default)]
pub struct ShaderCache {
    entries: HashMap<PathBuf, SystemTime>,
}

impl ShaderCache {
    pub fn remember(&mut self, path: PathBuf, modified: SystemTime) {
        self.entries.insert(path, modified);
    }

    pub fn is_current(&self, path: &PathBuf, modified: SystemTime) -> bool {
        self.entries.get(path).is_some_and(|cached| *cached == modified)
    }
}
