import { Layers3, Plus } from "lucide-react";
import { commands } from "../../lib/tauri";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { EmptyState } from "../shared/EmptyState";
import { PillButton } from "../shared/PillButton";

interface LevelsPanelProps {
  onCreateLevel: () => void;
}

export function LevelsPanel({ onCreateLevel }: LevelsPanelProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const levels = useSceneStore((state) => state.levels);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);

  async function openLevel(relativePath: string) {
    if (!currentProject) return;
    const level = await commands.openLevel(currentProject.rootPath, relativePath);
    setActiveLevel(level);
  }

  if (!currentProject) {
    return <EmptyState title="No project open" detail="Create or open a project to browse levels." />;
  }

  if (levels.length === 0) {
    return (
      <EmptyState
        title="No levels yet"
        detail="Create a level to start building your world."
        actions={<PillButton active onClick={onCreateLevel} icon={<Plus size={15} />}>Create Level</PillButton>}
      />
    );
  }

  return (
    <div className="tree-list">
      {levels.map((level) => (
        <button key={level.path} className={activeLevel?.path === level.path ? "tree-row is-selected" : "tree-row"} onClick={() => openLevel(level.relativePath)}>
          <Layers3 size={15} />
          <span>{level.name}</span>
        </button>
      ))}
    </div>
  );
}

