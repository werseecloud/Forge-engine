import { Bug, ChevronDown, Eye, MoreVertical, Play, Save, Wrench } from "lucide-react";
import { IconButton } from "../../../components/shared/IconButton";
import { PillButton } from "../../../components/shared/PillButton";
import { useBlueprintStore } from "../state/blueprintStore";
import { BackToEditorButton } from "./BackToEditorButton";

interface BlueprintTabHeaderProps {
  projectRoot: string | null;
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BlueprintTabHeader({ projectRoot, onBack, onError, onSuccess }: BlueprintTabHeaderProps) {
  const graph = useBlueprintStore((state) => state.activeGraph);
  const dirty = useBlueprintStore((state) => state.dirty);
  const saveGraph = useBlueprintStore((state) => state.saveGraph);
  const compile = useBlueprintStore((state) => state.compile);
  const runPreview = useBlueprintStore((state) => state.runPreview);

  async function save() {
    if (!projectRoot) return onError("Open a project before saving Blueprint graphs.");
    await saveGraph(projectRoot);
    onSuccess("Blueprint graph saved.");
  }

  return (
    <header className="blueprint-tab-header">
      <div className="blueprint-tab-header__left">
        <span className="forge-diamond">F</span>
        <div>
          <strong>Blueprints</strong>
          <em>{graph ? graph.name : "No graph open"}{dirty ? " *" : ""}</em>
        </div>
        {graph ? <b>{graph.graphType}</b> : null}
      </div>
      <div className="blueprint-tab-header__center">
        <BackToEditorButton onClick={onBack} />
      </div>
      <div className="blueprint-tab-header__right">
        <IconButton label="Save graph" disabled={!graph} onClick={() => void save()}><Save size={15} /></IconButton>
        <PillButton className="blueprint-compile-button" icon={<Wrench size={15} />} disabled={!graph} onClick={() => void compile()}>Compile</PillButton>
        <PillButton icon={<Play size={15} />} disabled={!graph} onClick={() => void runPreview()}>Play</PillButton>
        <button className="blueprint-debug-select"><Bug size={14} />Debug<ChevronDown size={14} /></button>
        <IconButton label="View options"><Eye size={15} /></IconButton>
        <IconButton label="More"><MoreVertical size={15} /></IconButton>
      </div>
    </header>
  );
}
