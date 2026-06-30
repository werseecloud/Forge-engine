import type { BlueprintGraph } from "../types/blueprint-types";

export function autoLayoutGraph(graph: BlueprintGraph): BlueprintGraph {
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  graph.edges.forEach((edge) => incoming.set(edge.toNodeId, (incoming.get(edge.toNodeId) ?? 0) + 1));
  const roots = graph.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const ordered = [...roots, ...graph.nodes.filter((node) => !roots.includes(node))];
  return {
    ...graph,
    nodes: ordered.map((node, index) => ({
      ...node,
      position: { x: 80 + (index % 4) * 320, y: 100 + Math.floor(index / 4) * 220 }
    })),
    updatedAt: new Date().toISOString()
  };
}
