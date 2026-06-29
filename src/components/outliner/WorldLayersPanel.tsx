import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { commands } from "../../lib/tauri";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { WorldLayer } from "../../types/scene";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";

export function WorldLayersPanel() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);

  async function persist(layers: WorldLayer[]) {
    if (!currentProject || !activeLevel) return;
    const saved = await commands.saveLevel(currentProject.rootPath, { ...activeLevel, layers });
    setActiveLevel(saved);
  }

  async function addLayer() {
    const layer: WorldLayer = {
      id: `layer_${crypto.randomUUID().replace(/-/g, "")}`,
      name: `Layer ${(activeLevel?.layers.length ?? 0) + 1}`,
      visible: true,
      color: "#8b5cf6"
    };
    await persist([...(activeLevel?.layers ?? []), layer]);
  }

  if (!currentProject || !activeLevel) {
    return <EmptyState title="No layers" detail="World layers are stored inside the active level file." />;
  }

  return (
    <div className="layers-panel">
      <div className="panel-title-row">
        <h3>World Layers</h3>
        <IconButton label="Add layer" onClick={addLayer}><Plus size={15} /></IconButton>
      </div>
      <div className="tree-list">
        {activeLevel.layers.map((layer) => (
          <div key={layer.id} className="tree-row">
            <span className="layer-dot" style={{ backgroundColor: layer.color }} />
            <span>{layer.name}</span>
            <button
              className="row-icon"
              aria-label="Toggle layer visibility"
              onClick={() => persist(activeLevel.layers.map((item) => item.id === layer.id ? { ...item, visible: !item.visible } : item))}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              className="row-icon"
              aria-label="Remove layer"
              onClick={() => persist(activeLevel.layers.filter((item) => item.id !== layer.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
