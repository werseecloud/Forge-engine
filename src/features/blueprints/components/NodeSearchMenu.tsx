import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { nodeRegistry } from "../data/nodeRegistry";
import { useBlueprintStore } from "../state/blueprintStore";

export function NodeSearchMenu() {
  const [query, setQuery] = useState("");
  const searchOpen = useBlueprintStore((state) => state.searchOpen);
  const searchPosition = useBlueprintStore((state) => state.searchPosition);
  const addNode = useBlueprintStore((state) => state.addNode);
  const closeSearch = useBlueprintStore((state) => state.closeSearch);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nodeRegistry.filter((node) => !q || [node.displayName, node.category, node.description, ...node.keywords].join(" ").toLowerCase().includes(q));
  }, [query]);

  if (!searchOpen) return null;

  return (
    <div className="node-search-menu" style={{ left: searchPosition.x, top: searchPosition.y }}>
      <div className="node-search-menu__search">
        <Search size={15} />
        <input autoFocus placeholder="Search nodes..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Escape" ? closeSearch() : undefined} />
      </div>
      <div className="node-search-menu__list">
        {filtered.map((node) => (
          <button key={node.type} onClick={() => addNode(node.type, searchPosition)}>
            <b style={{ background: node.color }}>{node.icon}</b>
            <span>
              <strong>{node.displayName}</strong>
              <em>{node.category}</em>
            </span>
            {!node.runtimeSupported ? <small>planned</small> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
