import { Bug, Download, FolderOpen, LayoutGrid, Play, Save, Search, Settings, Square, Upload, Wrench } from "lucide-react";
import { useRef } from "react";
import { IconButton } from "../../../components/shared/IconButton";
import { PillButton } from "../../../components/shared/PillButton";
import { useBlueprintStore } from "../state/blueprintStore";
import { downloadGraph, parseGraphJson } from "../utils/graphSerialization";

interface BlueprintToolbarProps {
  projectRoot: string | null;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BlueprintToolbar({ projectRoot, onClose, onError, onSuccess }: BlueprintToolbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const graph = useBlueprintStore((state) => state.activeGraph);
  const saveGraph = useBlueprintStore((state) => state.saveGraph);
  const compile = useBlueprintStore((state) => state.compile);
  const runPreview = useBlueprintStore((state) => state.runPreview);
  const openSearch = useBlueprintStore((state) => state.openSearch);
  const autoArrange = useBlueprintStore((state) => state.autoArrange);
  const setActiveGraph = useBlueprintStore((state) => state.setActiveGraph);

  async function save() {
    if (!projectRoot) return onError("Open a project before saving Blueprint graphs.");
    await saveGraph(projectRoot);
    onSuccess("Blueprint graph saved.");
  }

  async function importGraph(file: File) {
    try {
      const graph = parseGraphJson(await file.text());
      setActiveGraph({ ...graph, graphId: graph.graphId || crypto.randomUUID(), updatedAt: new Date().toISOString() });
      onSuccess("Graph JSON imported.");
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <header className="blueprint-toolbar">
      <div>
        <PillButton icon={<Save size={15} />} disabled={!graph} onClick={() => void save()}>Save</PillButton>
        <PillButton icon={<Wrench size={15} />} disabled={!graph} onClick={() => void compile()}>Compile</PillButton>
        <PillButton icon={<Play size={15} />} disabled={!graph} onClick={() => void runPreview()}>Play</PillButton>
        <IconButton label="Stop preview"><Square size={15} /></IconButton>
        <IconButton label="Debug mode"><Bug size={15} /></IconButton>
      </div>
      <div>
        <IconButton label="Auto arrange graph" disabled={!graph} onClick={autoArrange}><LayoutGrid size={15} /></IconButton>
        <IconButton label="Search nodes" disabled={!graph} onClick={() => openSearch({ x: 360, y: 180 })}><Search size={15} /></IconButton>
        <IconButton label="Graph settings"><Settings size={15} /></IconButton>
        <IconButton label="Export graph JSON" disabled={!graph} onClick={() => graph ? downloadGraph(graph) : undefined}><Download size={15} /></IconButton>
        <IconButton label="Import graph JSON" onClick={() => inputRef.current?.click()}><Upload size={15} /></IconButton>
        <input ref={inputRef} hidden type="file" accept=".forgegraph,application/json" onChange={(event) => event.target.files?.[0] ? void importGraph(event.target.files[0]) : undefined} />
        <PillButton icon={<FolderOpen size={15} />} onClick={onClose}>Editor</PillButton>
      </div>
    </header>
  );
}
