import type { BlueprintEdge as BlueprintEdgeType, BlueprintGraph } from "../types/blueprint-types";
import { useBlueprintStore } from "../state/blueprintStore";

interface BlueprintEdgeProps {
  edge: BlueprintEdgeType;
  graph: BlueprintGraph;
  selected: boolean;
  debugActive: boolean;
}

const nodeWidth = 244;
const headerHeight = 52;
const pinGap = 24;

export function BlueprintEdge({ edge, graph, selected, debugActive }: BlueprintEdgeProps) {
  const selectEdge = useBlueprintStore((state) => state.selectEdge);
  const fromNode = graph.nodes.find((node) => node.id === edge.fromNodeId);
  const toNode = graph.nodes.find((node) => node.id === edge.toNodeId);
  if (!fromNode || !toNode) return null;

  const fromIndex = Math.max(0, fromNode.outputs.findIndex((pin) => pin.id === edge.fromPinId));
  const toIndex = Math.max(0, toNode.inputs.findIndex((pin) => pin.id === edge.toPinId));
  const from = { x: fromNode.position.x + nodeWidth, y: fromNode.position.y + headerHeight + fromIndex * pinGap + 14 };
  const to = { x: toNode.position.x, y: toNode.position.y + headerHeight + toIndex * pinGap + 14 };
  const curve = Math.max(80, Math.abs(to.x - from.x) * 0.38);
  const d = `M ${from.x} ${from.y} C ${from.x + curve} ${from.y}, ${to.x - curve} ${to.y}, ${to.x} ${to.y}`;

  return (
    <path
      className={`blueprint-edge blueprint-edge--${edge.edgeType} blueprint-edge--${edge.dataType.toLowerCase()} ${selected ? "is-selected" : ""} ${debugActive ? "is-debug-active" : ""}`}
      d={d}
      onPointerDown={(event) => {
        event.stopPropagation();
        selectEdge(edge.id);
      }}
    />
  );
}
