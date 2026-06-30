import { ChevronDown, FolderOpen, GitBranch, Maximize2, MonitorCog, MousePointer2, Move3D, Pause, Play, Plus, RotateCcw, Save, Settings, SkipForward, Square, UserCircle } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useEditorModeStore } from "../../stores/useEditorModeStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { previewModes, useRuntimeStore, type PreviewMode } from "../../stores/useRuntimeStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { useViewportToolStore, type ViewportTool } from "../../stores/useViewportToolStore";
import { IconButton } from "../shared/IconButton";
import { CustomSelect } from "../shared/CustomSelect";
import { PillButton } from "../shared/PillButton";

interface TopToolbarProps {
  onCreateProject: () => void;
  onOpenProject: () => void;
  onGraphicsSettings: () => void;
  onSettings: () => void;
  onSave: () => void;
  onNotify: (tone: "success" | "warning" | "error", message: string) => void;
}

export function TopToolbar({ onCreateProject, onOpenProject, onGraphicsSettings, onSettings, onSave, onNotify }: TopToolbarProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const editorMode = useEditorModeStore((state) => state.mode);
  const enterPlayMode = useEditorModeStore((state) => state.enterPlayMode);
  const returnToEditMode = useEditorModeStore((state) => state.returnToEditMode);
  const setEditorError = useEditorModeStore((state) => state.setError);
  const setEditorWarning = useEditorModeStore((state) => state.setWarning);
  const previewMode = useRuntimeStore((state) => state.previewMode);
  const runtimePaused = useRuntimeStore((state) => state.runtimePaused);
  const setPreviewMode = useRuntimeStore((state) => state.setPreviewMode);
  const startRuntime = useRuntimeStore((state) => state.startRuntime);
  const stopRuntime = useRuntimeStore((state) => state.stopRuntime);
  const setPaused = useRuntimeStore((state) => state.setPaused);
  const stepFrame = useRuntimeStore((state) => state.stepFrame);
  const hasOpenScene = useSceneStore((state) => state.hasOpenScene);
  const hasPlayerStart = useSceneStore((state) => state.hasPlayerStart);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const activeTool = useViewportToolStore((state) => state.activeTool);
  const setActiveTool = useViewportToolStore((state) => state.setActiveTool);
  const setActiveContentTab = useAppStore((state) => state.setActiveContentTab);

  const isPlaying = editorMode === "PlayMode";

  function startPlayMode() {
    if (!hasOpenScene()) {
      const message = "Open a level before starting Play Mode.";
      setEditorError(message);
      onNotify("error", message);
      return;
    }
    if (!hasPlayerStart()) {
      const message = "No Player Start exists in the active scene.";
      setEditorWarning(message);
      onNotify("warning", message);
    }
    enterPlayMode();
    startRuntime();
    onNotify("success", `Play Mode started (${previewMode}).`);
  }

  function stopPlayMode() {
    stopRuntime();
    returnToEditMode();
    onNotify("success", "Returned to Edit Mode.");
  }

  function togglePause() {
    if (!isPlaying) return;
    setPaused(!runtimePaused);
    onNotify("success", runtimePaused ? "Runtime resumed." : "Runtime paused.");
  }

  function stepPausedFrame() {
    if (!isPlaying || !runtimePaused) return;
    stepFrame();
  }

  function activateTool(tool: ViewportTool) {
    setActiveTool(tool);
  }

  function openBlueprintGraph() {
    setActiveContentTab("Blueprints");
    onNotify("success", selectedSceneObject ? `Opened graph context for ${selectedSceneObject.name}.` : "Opened Blueprint browser.");
  }

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
        <PillButton active={isPlaying} icon={<Play size={15} />} onClick={startPlayMode}>Play</PillButton>
        <IconButton label={`Start ${previewMode}`} active={isPlaying} onClick={startPlayMode}><Play size={18} /></IconButton>
        <IconButton label={runtimePaused ? "Resume simulation" : "Pause simulation"} disabled={!isPlaying} active={runtimePaused} onClick={togglePause}><Pause size={16} /></IconButton>
        <IconButton label="Stop Play Mode" disabled={!isPlaying} onClick={stopPlayMode}><Square size={14} /></IconButton>
        <IconButton label="Step frame" disabled={!isPlaying || !runtimePaused} onClick={stepPausedFrame}><SkipForward size={16} /></IconButton>
      </div>

      <div className="toolbar-group toolbar-group--viewport">
        <CustomSelect className="custom-select--toolbar" value={previewMode} options={previewModes} onChange={(mode) => setPreviewMode(mode as PreviewMode)} />
        <IconButton label="Select tool" active={activeTool === "select"} onClick={() => activateTool("select")}><MousePointer2 size={16} /></IconButton>
        <IconButton label="Move tool" active={activeTool === "move"} onClick={() => activateTool("move")}><Move3D size={16} /></IconButton>
        <IconButton label="Rotate tool" active={activeTool === "rotate"} onClick={() => activateTool("rotate")}><RotateCcw size={16} /></IconButton>
        <IconButton label="Scale tool" active={activeTool === "scale"} onClick={() => activateTool("scale")}><Maximize2 size={16} /></IconButton>
        <IconButton label={selectedSceneObject ? "Open selected entity graph" : "Open Blueprint browser"} onClick={openBlueprintGraph}><GitBranch size={16} /></IconButton>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <PillButton onClick={onGraphicsSettings} icon={<MonitorCog size={15} />}>Graphics</PillButton>
        <PillButton onClick={onSettings} icon={<Settings size={15} />}>Settings</PillButton>
        <IconButton label="Local profile"><UserCircle size={19} /></IconButton>
      </div>
    </div>
  );
}
