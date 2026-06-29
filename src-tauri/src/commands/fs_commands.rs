use std::process::Command;

use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::models::fs::{AppDirectories, DirectoryNode, WatcherStatus};
use crate::services::fs_service;
use crate::utils::errors::{command_error, CommandResult};

#[tauri::command]
pub fn ensure_app_directories() -> CommandResult<AppDirectories> {
    crate::utils::paths::ensure_app_directories().map_err(command_error)
}

#[tauri::command]
pub fn choose_directory(app: tauri::AppHandle) -> CommandResult<Option<String>> {
    Ok(app
        .dialog()
        .file()
        .set_title("Choose Folder")
        .blocking_pick_folder()
        .and_then(file_path_to_string))
}

#[tauri::command]
pub fn choose_files(app: tauri::AppHandle) -> CommandResult<Vec<String>> {
    let paths = app
        .dialog()
        .file()
        .set_title("Choose Files")
        .blocking_pick_files()
        .unwrap_or_default()
        .into_iter()
        .filter_map(file_path_to_string)
        .collect();
    Ok(paths)
}

#[tauri::command]
pub fn read_directory_tree(root: String) -> CommandResult<DirectoryNode> {
    fs_service::read_directory_tree(&root).map_err(command_error)
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) -> CommandResult<()> {
    Command::new("explorer")
        .arg(path)
        .spawn()
        .map_err(command_error)?;
    Ok(())
}

#[tauri::command]
pub fn watch_project_directory(project_root: String) -> CommandResult<WatcherStatus> {
    Ok(fs_service::watch_project_directory(project_root))
}

fn file_path_to_string(file_path: FilePath) -> Option<String> {
    match file_path {
        FilePath::Path(path) => Some(path.to_string_lossy().to_string()),
        FilePath::Url(url) => url.to_file_path().ok().map(|path| path.to_string_lossy().to_string()),
    }
}

