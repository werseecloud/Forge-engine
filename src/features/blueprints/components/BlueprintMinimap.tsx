import type { BlueprintGraph } from "../types/blueprint-types";

interface BlueprintMinimapProps {
  graph: BlueprintGraph;
}

export function BlueprintMinimap({ graph }: BlueprintMinimapProps) {
  const nodes = graph.nodes;
  const minX = Math.min(0, ...nodes.map((node) => node.position.x));
  const minY = Math.min(0, ...nodes.map((node) => node.position.y));
  const maxX = Math.max(1, ...nodes.map((node) => node.position.x + 244));
  const maxY = Math.max(1, ...nodes.map((node) => node.position.y + 130));
  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div className="blueprint-minimap">
      {nodes.map((node) => (
        <span
          key={node.id}
          style={{
            left: `${((node.position.x - minX) / width) * 100}%`,
            top: `${((node.position.y - minY) / height) * 100}%`,
            width: `${Math.max(10, (244 / width) * 100)}%`,
            height: `${Math.max(8, (120 / height) * 100)}%`
          }}
        />
      ))}
    </div>
  );
}
