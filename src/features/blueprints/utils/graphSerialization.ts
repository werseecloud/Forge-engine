import type { BlueprintGraph } from "../types/blueprint-types";

export function serializeGraph(graph: BlueprintGraph) {
  return JSON.stringify({ ...graph, updatedAt: new Date().toISOString() }, null, 2);
}

export function parseGraphJson(source: string): BlueprintGraph {
  const graph = JSON.parse(source) as BlueprintGraph;
  if (!graph.graphId || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error("Invalid .forgegraph file: required graph fields are missing.");
  }
  return graph;
}

export function downloadGraph(graph: BlueprintGraph) {
  const blob = new Blob([serializeGraph(graph)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${graph.name.replace(/[^\w.-]+/g, "_")}.forgegraph`;
  anchor.click();
  URL.revokeObjectURL(url);
}
