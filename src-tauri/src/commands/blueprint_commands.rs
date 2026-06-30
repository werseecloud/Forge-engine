use crate::models::blueprint::{
    BlueprintCompileResult, BlueprintGraph, BlueprintGraphSummary, BlueprintRunResult,
};
use crate::services::blueprint_service;

#[tauri::command]
pub fn list_blueprint_graphs(project_root: String) -> Result<Vec<BlueprintGraphSummary>, String> {
    blueprint_service::list_graphs(&project_root).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_blueprint_graph(
    project_root: String,
    name: String,
    graph_type: String,
) -> Result<BlueprintGraph, String> {
    blueprint_service::create_graph(&project_root, &name, &graph_type)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn read_blueprint_graph(
    project_root: String,
    relative_path: String,
) -> Result<BlueprintGraph, String> {
    blueprint_service::read_graph(&project_root, &relative_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_blueprint_graph(
    project_root: String,
    graph: BlueprintGraph,
) -> Result<BlueprintGraph, String> {
    blueprint_service::save_graph(&project_root, graph).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_blueprint_graph(project_root: String, relative_path: String) -> Result<(), String> {
    blueprint_service::delete_graph(&project_root, &relative_path)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn duplicate_blueprint_graph(
    project_root: String,
    relative_path: String,
    new_name: String,
) -> Result<BlueprintGraph, String> {
    blueprint_service::duplicate_graph(&project_root, &relative_path, &new_name)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn compile_blueprint_graph(graph: BlueprintGraph) -> Result<BlueprintCompileResult, String> {
    Ok(blueprint_service::compile_graph(&graph))
}

#[tauri::command]
pub fn run_blueprint_preview(graph: BlueprintGraph) -> Result<BlueprintRunResult, String> {
    Ok(blueprint_service::run_preview(&graph))
}
