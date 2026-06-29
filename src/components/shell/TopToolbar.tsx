import { ChevronDown, FolderOpen, MousePointer2, Move3D, Pause, Play, Plus, RotateCcw, Save, Settings, SkipForward, Square, UserCircle, Waypoints } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { IconButton } from "../shared/IconButton";
import { PillButton } from "../shared/PillButton";

interface TopToolbarProps {
  onCreateProject: () => void;
  onOpenProject: () => void;
  onSettings: () => void;
  onSave: () => void;
}

export function TopToolbar({ onCreateProject, onOpenProject, onSettings, onSave }: TopToolbarProps) {
  const currentProject = useProjectStore((state) => state.currentProject);

  return (
    <div className="top-toolbar">
      <div className="toolbar-group toolbar-group--project">
        <button className="forge-logo-button" aria-label="Forge home"><span>F</span></button>
        <button className="project-switcher" onClick={onOpenProject}>
          <span>{currentProject?.projectName ?? "No project open"}</span>
          <ChevronDown size={15} />
        </button>
        <IconButton label="Create or open project" onClick={onCreateProject}><Plus size={16} /></IconButton>
        <IconButton label="Open project" onClick={onOpenProject}><FolderOpen size={16} /></IconButton>
        <IconButton label="Save level" onClick={onSave}><Save size={16} /></IconButton>
      </div>

      <div className="toolbar-group toolbar-group--play">
        <PillButton icon={<Play size={15} />}>Play</PillButton>
        <IconButton label="Start" active><Play size={18} /></IconButton>
        <IconButton label="Pause"><Pause size={16} /></IconButton>
        <IconButton label="Stop"><Square size={14} /></IconButton>
        <IconButton label="Step frame"><SkipForward size={16} /></IconButton>
      </div>

      <div className="toolbar-group toolbar-group--viewport">
        <PillButton>Game</PillButton>
        <IconButton label="Select tool" active><MousePointer2 size={16} /></IconButton>
        <IconButton label="Move tool"><Move3D size={16} /></IconButton>
        <IconButton label="Rotate tool"><RotateCcw size={16} /></IconButton>
        <IconButton label="Snapping"><Waypoints size={16} /></IconButton>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <PillButton onClick={onSettings} icon={<Settings size={15} />}>Settings</PillButton>
        <IconButton label="Local profile"><UserCircle size={19} /></IconButton>
      </div>
    </div>
  );
}

