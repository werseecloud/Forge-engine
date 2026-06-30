use anyhow::{anyhow, Result};
use chrono::Utc;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::time::Instant;
use uuid::Uuid;

use crate::models::blueprint::*;
use crate::utils::paths::{
    ensure_within, normalize_relative_path, sanitize_file_stem, write_json_pretty,
};

const SUPPORTED_RUNTIME_NODES: &[&str] = &[
    "event.begin_play",
    "event.tick",
    "flow.branch",
    "flow.delay",
    "debug.print_string",
    "variable.set",
    "variable.get",
    "math.add",
    "math.compare",
    "entity.spawn",
];

pub fn blueprint_dir(project_root: &str) -> Result<PathBuf> {
    let root = PathBuf::from(project_root);
    let dir = root.join("Content").join("Blueprints");
    ensure_within(&root, &dir)?;
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn list_graphs(project_root: &str) -> Result<Vec<BlueprintGraphSummary>> {
    let root = PathBuf::from(project_root);
    let dir = blueprint_dir(project_root)?;
    let mut graphs = Vec::new();

    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("forgegraph") {
            continue;
        }
        let graph: BlueprintGraph = crate::utils::paths::read_json(&path)?;
        graphs.push(BlueprintGraphSummary {
            graph_id: graph.graph_id,
            name: graph.name,
            graph_type: graph.graph_type,
            relative_path: normalize_relative_path(&path, &root),
            updated_at: graph.updated_at,
        });
    }

    graphs.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(graphs)
}

pub fn create_graph(project_root: &str, name: &str, graph_type: &str) -> Result<BlueprintGraph> {
    let now = Utc::now().to_rfc3339();
    let graph = BlueprintGraph {
        graph_id: Uuid::new_v4().to_string(),
        name: name.trim().to_string(),
        graph_type: graph_type.to_string(),
        nodes: vec![begin_play_node()],
        edges: Vec::new(),
        variables: Vec::new(),
        exposed_inputs: Vec::new(),
        exposed_outputs: Vec::new(),
        metadata: HashMap::new(),
        version: 1,
        created_at: now.clone(),
        updated_at: now,
    };
    save_graph(project_root, graph.clone())?;
    Ok(graph)
}

pub fn read_graph(project_root: &str, relative_path: &str) -> Result<BlueprintGraph> {
    let root = PathBuf::from(project_root);
    let path = ensure_within(&root, &root.join(relative_path))?;
    let graph: BlueprintGraph = crate::utils::paths::read_json(&path)?;
    Ok(graph)
}

pub fn save_graph(project_root: &str, mut graph: BlueprintGraph) -> Result<BlueprintGraph> {
    if graph.name.trim().is_empty() {
        return Err(anyhow!("Blueprint graph name cannot be empty."));
    }
    graph.updated_at = Utc::now().to_rfc3339();
    let dir = blueprint_dir(project_root)?;
    let path = dir.join(format!("{}.forgegraph", sanitize_file_stem(&graph.name)));
    write_json_pretty(&path, &graph)?;
    Ok(graph)
}

pub fn delete_graph(project_root: &str, relative_path: &str) -> Result<()> {
    let root = PathBuf::from(project_root);
    let path = ensure_within(&root, &root.join(relative_path))?;
    if path.extension().and_then(|ext| ext.to_str()) != Some("forgegraph") {
        return Err(anyhow!(
            "Only .forgegraph files can be deleted through the Blueprint service."
        ));
    }
    fs::remove_file(path)?;
    Ok(())
}

pub fn duplicate_graph(
    project_root: &str,
    relative_path: &str,
    new_name: &str,
) -> Result<BlueprintGraph> {
    let mut graph = read_graph(project_root, relative_path)?;
    graph.graph_id = Uuid::new_v4().to_string();
    graph.name = new_name.to_string();
    graph.created_at = Utc::now().to_rfc3339();
    graph.updated_at = graph.created_at.clone();
    save_graph(project_root, graph)
}

pub fn compile_graph(graph: &BlueprintGraph) -> BlueprintCompileResult {
    let diagnostics = validate_graph(graph);
    let has_errors = diagnostics.iter().any(|diag| diag.severity == "error");
    if has_errors {
        return BlueprintCompileResult {
            success: false,
            diagnostics,
            ir: None,
        };
    }

    let entry_nodes = graph
        .nodes
        .iter()
        .filter(|node| node.node_type.starts_with("event."))
        .map(|node| node.id.clone())
        .collect::<Vec<_>>();

    BlueprintCompileResult {
        success: true,
        diagnostics,
        ir: Some(BlueprintIr {
            graph_id: graph.graph_id.clone(),
            graph_name: graph.name.clone(),
            nodes: graph
                .nodes
                .iter()
                .filter(|node| !node.disabled)
                .map(|node| BlueprintIrNode {
                    id: node.id.clone(),
                    node_type: node.node_type.clone(),
                    title: node.title.clone(),
                    properties: node.properties.clone(),
                })
                .collect(),
            edges: graph
                .edges
                .iter()
                .map(|edge| BlueprintIrEdge {
                    from_node_id: edge.from_node_id.clone(),
                    from_pin_id: edge.from_pin_id.clone(),
                    to_node_id: edge.to_node_id.clone(),
                    to_pin_id: edge.to_pin_id.clone(),
                    edge_type: edge.edge_type.clone(),
                })
                .collect(),
            entry_nodes,
        }),
    }
}

pub fn run_preview(graph: &BlueprintGraph) -> BlueprintRunResult {
    let compile = compile_graph(graph);
    if !compile.success {
        return BlueprintRunResult {
            success: false,
            diagnostics: compile.diagnostics,
            traces: Vec::new(),
            variables: HashMap::new(),
        };
    }

    let mut diagnostics = compile.diagnostics;
    let mut variables = graph
        .variables
        .iter()
        .map(|var| (var.name.clone(), var.default_value.clone()))
        .collect::<HashMap<_, _>>();
    let mut traces = Vec::new();
    let node_map = graph
        .nodes
        .iter()
        .map(|node| (node.id.as_str(), node))
        .collect::<HashMap<_, _>>();
    let mut exec_edges: HashMap<&str, Vec<&BlueprintEdge>> = HashMap::new();
    for edge in graph
        .edges
        .iter()
        .filter(|edge| edge.edge_type == "execution")
    {
        exec_edges
            .entry(edge.from_node_id.as_str())
            .or_default()
            .push(edge);
    }

    let mut queue = graph
        .nodes
        .iter()
        .filter(|node| node.node_type == "event.begin_play")
        .map(|node| node.id.clone())
        .collect::<Vec<_>>();
    let mut steps = 0usize;

    while let Some(node_id) = queue.pop() {
        steps += 1;
        if steps > 512 {
            diagnostics.push(diag(
                "runtime_loop_guard",
                "warning",
                "Blueprint preview stopped after 512 execution steps.",
                Some(node_id),
                None,
                "Check loop nodes or execution cycles.",
            ));
            break;
        }

        let Some(node) = node_map.get(node_id.as_str()) else {
            continue;
        };
        let start = Instant::now();
        let message = execute_node(node, graph, &mut variables);
        traces.push(BlueprintExecutionTrace {
            node_id: node.id.clone(),
            node_title: node.title.clone(),
            message,
            elapsed_micros: start.elapsed().as_micros(),
        });

        if node.node_type == "flow.branch" {
            let condition = node
                .properties
                .get("condition")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let desired_pin = if condition { "then" } else { "else" };
            if let Some(edges) = exec_edges.get(node.id.as_str()) {
                for edge in edges
                    .iter()
                    .filter(|edge| edge.from_pin_id == desired_pin)
                    .rev()
                {
                    queue.push(edge.to_node_id.clone());
                }
            }
            continue;
        }

        if let Some(edges) = exec_edges.get(node.id.as_str()) {
            for edge in edges.iter().rev() {
                queue.push(edge.to_node_id.clone());
            }
        }
    }

    BlueprintRunResult {
        success: !diagnostics.iter().any(|diag| diag.severity == "error"),
        diagnostics,
        traces,
        variables,
    }
}

fn validate_graph(graph: &BlueprintGraph) -> Vec<BlueprintDiagnostic> {
    let mut diagnostics = Vec::new();
    let mut node_ids = HashSet::new();
    let mut variable_names = HashSet::new();

    for node in &graph.nodes {
        if !node_ids.insert(node.id.as_str()) {
            diagnostics.push(diag(
                "duplicate_node",
                "error",
                "Duplicate node id found.",
                Some(node.id.clone()),
                None,
                "Delete or recreate the duplicated node.",
            ));
        }
        if !SUPPORTED_RUNTIME_NODES.contains(&node.node_type.as_str()) {
            diagnostics.push(diag(
                "unsupported_runtime_node",
                "warning",
                format!(
                    "{} is registered for authoring but has no Rust VM handler yet.",
                    node.title
                ),
                Some(node.id.clone()),
                None,
                "Use this node for planning only, or add a native runtime handler.",
            ));
        }
        for pin in node.inputs.iter().filter(|pin| pin.required) {
            let has_edge = graph
                .edges
                .iter()
                .any(|edge| edge.to_node_id == node.id && edge.to_pin_id == pin.id);
            if !has_edge && pin.default_value.is_none() {
                diagnostics.push(diag(
                    "required_pin",
                    "error",
                    format!("Required input pin '{}' is not connected.", pin.name),
                    Some(node.id.clone()),
                    None,
                    "Connect the pin or set a default value.",
                ));
            }
        }
    }

    for variable in &graph.variables {
        let key = variable.name.to_lowercase();
        if !variable_names.insert(key) {
            diagnostics.push(diag(
                "duplicate_variable",
                "error",
                format!("Duplicate variable name '{}'.", variable.name),
                None,
                None,
                "Rename one of the variables.",
            ));
        }
    }

    for edge in &graph.edges {
        let from = graph.nodes.iter().find(|node| node.id == edge.from_node_id);
        let to = graph.nodes.iter().find(|node| node.id == edge.to_node_id);
        let (Some(from), Some(to)) = (from, to) else {
            diagnostics.push(diag(
                "missing_edge_node",
                "error",
                "Wire references a missing node.",
                None,
                Some(edge.id.clone()),
                "Delete the wire and reconnect existing nodes.",
            ));
            continue;
        };
        let from_pin = from.outputs.iter().find(|pin| pin.id == edge.from_pin_id);
        let to_pin = to.inputs.iter().find(|pin| pin.id == edge.to_pin_id);
        let (Some(from_pin), Some(to_pin)) = (from_pin, to_pin) else {
            diagnostics.push(diag(
                "missing_edge_pin",
                "error",
                "Wire references a missing pin.",
                None,
                Some(edge.id.clone()),
                "Delete the wire and reconnect valid pins.",
            ));
            continue;
        };
        if from_pin.pin_kind != to_pin.pin_kind {
            diagnostics.push(diag(
                "pin_kind_mismatch",
                "error",
                "Execution pins and data pins cannot be connected together.",
                None,
                Some(edge.id.clone()),
                "Connect pins of the same kind.",
            ));
        }
        if from_pin.pin_kind == "data" && !types_compatible(&from_pin.data_type, &to_pin.data_type)
        {
            diagnostics.push(diag(
                "pin_type_mismatch",
                "error",
                format!(
                    "{} cannot connect to {}.",
                    from_pin.data_type, to_pin.data_type
                ),
                None,
                Some(edge.id.clone()),
                "Add a conversion node or use matching data types.",
            ));
        }
    }

    if has_execution_cycle(graph) {
        diagnostics.push(diag(
            "execution_cycle",
            "error",
            "Execution flow contains a cycle without an explicit loop node.",
            None,
            None,
            "Use a For Loop/While Loop node with safety limits.",
        ));
    }

    diagnostics
}

fn types_compatible(from: &str, to: &str) -> bool {
    from == to || to == "Any" || from == "Any" || (from == "Int" && to == "Float")
}

fn has_execution_cycle(graph: &BlueprintGraph) -> bool {
    let mut adjacency: HashMap<&str, Vec<&str>> = HashMap::new();
    for edge in graph
        .edges
        .iter()
        .filter(|edge| edge.edge_type == "execution")
    {
        adjacency
            .entry(edge.from_node_id.as_str())
            .or_default()
            .push(edge.to_node_id.as_str());
    }
    let mut visiting = HashSet::new();
    let mut visited = HashSet::new();
    graph
        .nodes
        .iter()
        .any(|node| visit_cycle(node.id.as_str(), &adjacency, &mut visiting, &mut visited))
}

fn visit_cycle<'a>(
    node: &'a str,
    adjacency: &HashMap<&'a str, Vec<&'a str>>,
    visiting: &mut HashSet<&'a str>,
    visited: &mut HashSet<&'a str>,
) -> bool {
    if visited.contains(node) {
        return false;
    }
    if !visiting.insert(node) {
        return true;
    }
    for next in adjacency.get(node).into_iter().flatten() {
        if visit_cycle(next, adjacency, visiting, visited) {
            return true;
        }
    }
    visiting.remove(node);
    visited.insert(node);
    false
}

fn execute_node(
    node: &BlueprintNode,
    _graph: &BlueprintGraph,
    variables: &mut HashMap<String, Value>,
) -> String {
    match node.node_type.as_str() {
        "event.begin_play" => "Begin Play event fired.".to_string(),
        "event.tick" => "Tick event preview fired once.".to_string(),
        "debug.print_string" => format!(
            "Print String: {}",
            node.properties
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("Hello from Forge Blueprint")
        ),
        "flow.delay" => format!(
            "Delay scheduled for {} seconds.",
            node.properties
                .get("seconds")
                .and_then(Value::as_f64)
                .unwrap_or(1.0)
        ),
        "variable.set" => {
            let name = node
                .properties
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("Variable");
            let value = node.properties.get("value").cloned().unwrap_or(Value::Null);
            variables.insert(name.to_string(), value.clone());
            format!("Set variable '{}' = {}", name, value)
        }
        "variable.get" => {
            let name = node
                .properties
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("Variable");
            format!(
                "Read variable '{}' = {}",
                name,
                variables.get(name).unwrap_or(&Value::Null)
            )
        }
        "math.add" => "Add evaluated by data resolver.".to_string(),
        "math.compare" => "Compare evaluated by data resolver.".to_string(),
        "entity.spawn" => format!(
            "Spawn Entity command queued: {}",
            node.properties
                .get("prefab")
                .and_then(Value::as_str)
                .unwrap_or("Entity")
        ),
        _ => format!("{} skipped: no VM handler registered.", node.title),
    }
}

fn begin_play_node() -> BlueprintNode {
    BlueprintNode {
        id: Uuid::new_v4().to_string(),
        node_type: "event.begin_play".to_string(),
        title: "Event Begin Play".to_string(),
        category: "Event Nodes".to_string(),
        position: BlueprintPosition { x: 80.0, y: 120.0 },
        inputs: Vec::new(),
        outputs: vec![BlueprintPin {
            id: "then".to_string(),
            name: "Then".to_string(),
            direction: "output".to_string(),
            pin_kind: "execution".to_string(),
            data_type: "Exec".to_string(),
            required: false,
            default_value: None,
            multiple_connections_allowed: true,
        }],
        properties: HashMap::new(),
        execution_mode: "event".to_string(),
        breakpoint_enabled: false,
        comment: String::new(),
        disabled: false,
        metadata: HashMap::new(),
    }
}

fn diag(
    id: &str,
    severity: &str,
    message: impl Into<String>,
    node_id: Option<String>,
    edge_id: Option<String>,
    recovery: &str,
) -> BlueprintDiagnostic {
    BlueprintDiagnostic {
        id: id.to_string(),
        severity: severity.to_string(),
        message: message.into(),
        node_id,
        edge_id,
        recovery: recovery.to_string(),
    }
}
