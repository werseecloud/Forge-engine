import type { BlueprintDiagnostic, BlueprintEdge, BlueprintGraph, BlueprintPin } from "../types/blueprint-types";
import { findNodeDefinition } from "../data/nodeRegistry";

export function pinsCompatible(from: BlueprintPin, to: BlueprintPin) {
  if (from.direction !== "output" || to.direction !== "input") return false;
  if (from.pinKind !== to.pinKind) return false;
  if (from.pinKind === "execution") return true;
  return from.dataType === to.dataType || from.dataType === "Any" || to.dataType === "Any" || (from.dataType === "Int" && to.dataType === "Float");
}

export function validateConnection(graph: BlueprintGraph, fromNodeId: string, fromPinId: string, toNodeId: string, toPinId: string): BlueprintDiagnostic | null {
  const fromNode = graph.nodes.find((node) => node.id === fromNodeId);
  const toNode = graph.nodes.find((node) => node.id === toNodeId);
  const fromPin = fromNode?.outputs.find((pin) => pin.id === fromPinId);
  const toPin = toNode?.inputs.find((pin) => pin.id === toPinId);
  if (!fromNode || !toNode || !fromPin || !toPin) return diagnostic("error", "Connection references a missing node or pin.", "Reconnect existing pins.");
  if (fromNodeId === toNodeId) return diagnostic("error", "A node cannot connect to itself.", "Connect to another node.");
  if (!pinsCompatible(fromPin, toPin)) return diagnostic("error", `${fromPin.dataType} ${fromPin.pinKind} cannot connect to ${toPin.dataType} ${toPin.pinKind}.`, "Use matching pin kinds and compatible data types.");
  if (!toPin.multipleConnectionsAllowed && graph.edges.some((edge) => edge.toNodeId === toNodeId && edge.toPinId === toPinId)) {
    return diagnostic("error", "This input pin already has a connection.", "Disconnect the existing wire first.");
  }
  return null;
}

export function validateGraph(graph: BlueprintGraph): BlueprintDiagnostic[] {
  const diagnostics: BlueprintDiagnostic[] = [];
  const variables = new Set<string>();
  for (const node of graph.nodes) {
    if (!findNodeDefinition(node.type)) diagnostics.push(diagnostic("error", `Missing node type: ${node.type}.`, "Install the plugin or replace the node.", node.id));
    for (const pin of node.inputs.filter((input) => input.required)) {
      const connected = graph.edges.some((edge) => edge.toNodeId === node.id && edge.toPinId === pin.id);
      if (!connected && pin.defaultValue === undefined) diagnostics.push(diagnostic("error", `Required pin '${pin.name}' is not connected.`, "Connect it or set a default.", node.id));
    }
    if (node.metadata.runtimeSupported === false) diagnostics.push(diagnostic("warning", `${node.title} is available in the editor but not executable in the Rust VM yet.`, "Keep it for design or implement a native handler.", node.id));
  }
  for (const variable of graph.variables) {
    const key = variable.name.trim().toLowerCase();
    if (variables.has(key)) diagnostics.push(diagnostic("error", `Duplicate variable '${variable.name}'.`, "Rename one of the variables."));
    variables.add(key);
  }
  for (const edge of graph.edges) {
    const check = validateExistingEdge(graph, edge);
    if (check) diagnostics.push(check);
  }
  if (hasExecutionCycle(graph)) diagnostics.push(diagnostic("error", "Execution flow contains a cycle without an explicit loop node.", "Use a loop node with safety limits."));
  return diagnostics;
}

function validateExistingEdge(graph: BlueprintGraph, edge: BlueprintEdge) {
  const fromNode = graph.nodes.find((node) => node.id === edge.fromNodeId);
  const toNode = graph.nodes.find((node) => node.id === edge.toNodeId);
  const fromPin = fromNode?.outputs.find((pin) => pin.id === edge.fromPinId);
  const toPin = toNode?.inputs.find((pin) => pin.id === edge.toPinId);
  if (!fromPin || !toPin) return diagnostic("error", "Wire references a missing pin.", "Delete and reconnect the wire.", undefined, edge.id);
  return pinsCompatible(fromPin, toPin) ? null : diagnostic("error", "Wire has incompatible pin types.", "Delete and reconnect compatible pins.", undefined, edge.id);
}

function hasExecutionCycle(graph: BlueprintGraph) {
  const adjacency = new Map<string, string[]>();
  graph.edges.filter((edge) => edge.edgeType === "execution").forEach((edge) => adjacency.set(edge.fromNodeId, [...(adjacency.get(edge.fromNodeId) ?? []), edge.toNodeId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (visited.has(nodeId)) return false;
    if (visiting.has(nodeId)) return true;
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) if (visit(next)) return true;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  return graph.nodes.some((node) => visit(node.id));
}

function diagnostic(severity: BlueprintDiagnostic["severity"], message: string, recovery: string, nodeId?: string, edgeId?: string): BlueprintDiagnostic {
  return { id: crypto.randomUUID(), severity, message, recovery, nodeId, edgeId };
}
