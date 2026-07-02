import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { nodeRegistry } from "../data/nodeRegistry";
import { useBlueprintStore } from "../state/blueprintStore";
import type { BlueprintNodeDefinition } from "../types/blueprint-types";

export function NodeSearchMenu() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchOpen = useBlueprintStore((state) => state.searchOpen);
  const searchPosition = useBlueprintStore((state) => state.searchPosition);
  const pendingConnection = useBlueprintStore((state) => state.pendingConnection);
  const graph = useBlueprintStore((state) => state.activeGraph);
  const addNode = useBlueprintStore((state) => state.addNode);
  const closeSearch = useBlueprintStore((state) => state.closeSearch);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pendingPin = pendingConnection && graph
      ? graph.nodes.find((node) => node.id === pendingConnection.nodeId)?.[pendingConnection.direction === "output" ? "outputs" : "inputs"].find((pin) => pin.id === pendingConnection.pinId)
      : null;
    return nodeRegistry.filter((node) => {
      const textMatch = !q || [node.displayName, node.category, node.description, ...node.keywords].join(" ").toLowerCase().includes(q);
      if (!textMatch) return false;
      if (!pendingPin) return true;
      const candidatePins = pendingConnection?.direction === "output" ? node.inputs : node.outputs;
      return candidatePins.some((pin) => pin.pinKind === pendingPin.pinKind && (pin.dataType === pendingPin.dataType || pin.dataType === "Any" || pendingPin.dataType === "Any" || (pendingPin.dataType === "Int" && pin.dataType === "Float")));
    });
  }, [graph, pendingConnection, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, BlueprintNodeDefinition[]>();
    filtered.forEach((node) => map.set(node.category, [...(map.get(node.category) ?? []), node]));
    return Array.from(map.entries());
  }, [filtered]);

  if (!searchOpen) return null;

  function place(node: BlueprintNodeDefinition) {
    addNode(node.type, searchPosition);
    setQuery("");
    setActiveIndex(0);
  }

  const activeNode = filtered[Math.min(activeIndex, Math.max(0, filtered.length - 1))];

  return (
    <div className="node-search-menu" style={{ left: searchPosition.x, top: searchPosition.y }}>
      <div className="node-search-menu__search">
        <Search size={15} />
        <input
          autoFocus
          placeholder={pendingConnection ? "Search compatible nodes..." : "Search nodes..."}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeSearch();
            if (event.key === "ArrowDown") setActiveIndex((value) => Math.min(filtered.length - 1, value + 1));
            if (event.key === "ArrowUp") setActiveIndex((value) => Math.max(0, value - 1));
            if (event.key === "Enter" && activeNode) place(activeNode);
          }}
        />
      </div>
      <div className="node-search-menu__list">
        {grouped.map(([category, nodes]) => (
          <section key={category}>
            <h4>{category}</h4>
            {nodes.map((node) => {
              const index = filtered.indexOf(node);
              return (
                <button key={node.type} className={index === activeIndex ? "is-active" : ""} onClick={() => place(node)}>
                  <b style={{ background: node.color }}>{node.icon}</b>
                  <span>
                    <strong>{node.displayName}</strong>
                    <em>{node.description}</em>
                  </span>
                  {!node.runtimeSupported ? <small>planned</small> : null}
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
