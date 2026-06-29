import { Box, Eye, EyeOff, Layers3, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";
import { PillButton } from "../shared/PillButton";

interface WorldOutlinerProps {
  onCreateLevel: () => void;
}

export function WorldOutliner({ onCreateLevel }: WorldOutlinerProps) {
  const [query, setQuery] = useState("");
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const selectEntity = useAppStore((state) => state.selectEntity);

  const objects = useMemo(() => {
    const all = activeLevel?.objects ?? [];
    if (!query.trim()) return all;
    return all.filter((object) => object.name.toLowerCase().includes(query.toLowerCase()));
  }, [activeLevel?.objects, query]);

  if (!currentProject) {
    return <EmptyState title="No project open" detail="World data appears here after opening a Forge project." />;
  }

  if (!activeLevel) {
    return (
      <EmptyState
        title="No level loaded"
        detail="Create a level to start building your world."
        actions={<PillButton active onClick={onCreateLevel}>Create Level</PillButton>}
      />
    );
  }

  return (
    <div className="outliner">
      <div className="panel-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." />
        <IconButton label="Filter"><SlidersHorizontal size={15} /></IconButton>
      </div>
      <div className="tree-list">
        <div className="tree-row tree-row--level">
          <Layers3 size={15} />
          <span>{activeLevel.name}</span>
          <Eye size={14} />
        </div>
        {objects.length === 0 ? (
          <div className="inline-empty">No scene objects in this level.</div>
        ) : (
          objects.map((object) => (
            <button
              key={object.id}
              className={selectedSceneObject?.id === object.id ? "tree-row tree-row--child is-selected" : "tree-row tree-row--child"}
              onClick={() => {
                setSelectedSceneObject(object);
                selectEntity(object);
              }}
            >
              <Box size={14} />
              <span>{object.name}</span>
              {object.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

