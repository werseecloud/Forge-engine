use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::fs::{DirectoryNode, WatcherStatus};
use crate::utils::paths::normalize_relative_path;

pub fn read_directory_tree(root: &str) -> Result<DirectoryNode> {
    let root_path = PathBuf::from(root);
    build_node(&root_path, &root_path)
}

fn build_node(path: &Path, root: &Path) -> Result<DirectoryNode> {
    let metadata = fs::metadata(path)?;
    let is_directory = metadata.is_dir();
    let mut children = Vec::new();

    if is_directory {
        let mut entries = fs::read_dir(path)?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .collect::<Vec<_>>();
        entries.sort_by(|a, b| {
            let a_dir = a.is_dir();
            let b_dir = b.is_dir();
            b_dir.cmp(&a_dir).then_with(|| {
                a.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase()
                    .cmp(&b.file_name().unwrap_or_default().to_string_lossy().to_lowercase())
            })
        });

        for entry in entries {
            if entry
                .file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.ends_with(".forge_meta"))
                .unwrap_or(false)
            {
                continue;
            }
            children.push(build_node(&entry, root)?);
        }
    }

    Ok(DirectoryNode {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: path.to_string_lossy().to_string(),
        relative_path: normalize_relative_path(path, root),
        is_directory,
        children,
    })
}

pub fn watch_project_directory(project_root: String) -> WatcherStatus {
    WatcherStatus {
        project_root,
        active: true,
        mode: "polling-refresh".to_string(),
    }
}

