import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { blueprintCategories, nodeRegistry } from "../data/nodeRegistry";
import { useBlueprintStore } from "../state/blueprintStore";

export function NodeLibrary() {
  const [query, setQuery] = useState("");
  const addNode = useBlueprintStore((state) => state.addNode);
  const graph = useBlueprintStore((state) => state.activeGraph);

  const nodesByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = nodeRegistry.filter((node) => !q || [node.displayName, node.category, node.description, ...node.keywords].join(" ").toLowerCase().includes(q));
    return blueprintCategories.map((category) => ({
      category,
      nodes: category === "Favorites" ? filtered.slice(0, 8) : filtered.filter((node) => node.category === category)
    })).filter((group) => group.nodes.length > 0);
  }, [query]);

  return (
    <section className="node-library">
      <div className="node-library__search">
        <Search size={15} />
        <input placeholder="Search nodes..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="node-library__groups">
        {nodesByCategory.map((group) => (
          <details key={group.category} open={group.category === "Favorites" || Boolean(query)}>
            <summary>{group.category}<span>{group.nodes.length}</span></summary>
            {group.nodes.map((node) => (
              <button
                key={node.type}
                draggable
                disabled={!graph}
                onDragStart={(event) => event.dataTransfer.setData("application/forge-node-type", node.type)}
                onDoubleClick={() => addNode(node.type, { x: 320, y: 220 })}
              >
                <b style={{ background: node.color }}>{node.icon}</b>
                <span>
                  <strong>{node.displayName}</strong>
                  <em>{node.description}</em>
                </span>
                <Star size={13} />
              </button>
            ))}
          </details>
        ))}
      </div>
    </section>
  );
}
