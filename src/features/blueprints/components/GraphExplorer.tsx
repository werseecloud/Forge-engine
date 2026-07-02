import { useEffect, useMemo, useState } from "react";
import { Copy, FilePlus2, GitBranch, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { IconButton } from "../../../components/shared/IconButton";
import { CustomSelect } from "../../../components/shared/CustomSelect";
import { commands } from "../../../lib/tauri";
import { createExampleGraphs } from "../data/exampleGraphs";
import { graphTypes } from "../data/nodeRegistry";
import { useBlueprintStore } from "../state/blueprintStore";

interface GraphExplorerProps {
  projectRoot: string | null;
  onError: (message: string) => void;
}

const starterGraphs = [
  ["PlayerController", "Actor Blueprint", "compiled"],
  ["EnemyAI", "AI Blueprint", "warnings"],
  ["DoorSystem", "Actor Blueprint", "compiled"],
  ["WeaponBase", "Actor Blueprint", "compiled"],
  ["HUD_Health", "UI Blueprint", "warnings"],
  ["GameMode_Main", "Level Blueprint", "compiled"],
  ["InventorySystem", "Component Blueprint", "compiled"],
  ["GlobalEvents", "Global Blueprint", "errors"]
] as const;

export function GraphExplorer({ projectRoot, onError }: GraphExplorerProps) {
  const [graphType, setGraphType] = useState<string>("Actor Blueprint");
  const graphs = useBlueprintStore((state) => state.graphs);
  const activeGraph = useBlueprintStore((state) => state.activeGraph);
  const loadGraphs = useBlueprintStore((state) => state.loadGraphs);
  const createGraph = useBlueprintStore((state) => state.createGraph);
  const openGraph = useBlueprintStore((state) => state.openGraph);
  const deleteGraph = useBlueprintStore((state) => state.deleteGraph);
  const duplicateGraph = useBlueprintStore((state) => state.duplicateGraph);
  const setActiveGraph = useBlueprintStore((state) => state.setActiveGraph);

  useEffect(() => {
    if (projectRoot) void loadGraphs(projectRoot).catch((error) => onError(String(error)));
  }, [loadGraphs, onError, projectRoot]);

  const activeSummary = useMemo(() => graphs.find((graph) => graph.graphId === activeGraph?.graphId), [activeGraph?.graphId, graphs]);

  async function createNewGraph() {
    if (!projectRoot) return onError("Open a Forge project before creating Blueprint graphs.");
    const name = window.prompt("Graph name", "New Blueprint");
    if (!name) return;
    await createGraph(projectRoot, name, graphType).catch((error) => onError(String(error)));
  }

  async function duplicateActive() {
    if (!projectRoot || !activeSummary) return;
    const name = window.prompt("Duplicate graph as", `${activeSummary.name} Copy`);
    if (!name) return;
    await duplicateGraph(projectRoot, activeSummary.relativePath, name).catch((error) => onError(String(error)));
  }

  async function renameActive() {
    if (!activeGraph) return;
    const name = window.prompt("Rename graph", activeGraph.name);
    if (!name) return;
    setActiveGraph({ ...activeGraph, name, updatedAt: new Date().toISOString() });
  }

  async function deleteActive() {
    if (!projectRoot || !activeSummary) return;
    if (!window.confirm(`Delete ${activeSummary.name}?`)) return;
    await deleteGraph(projectRoot, activeSummary.relativePath).catch((error) => onError(String(error)));
  }

  async function createExamples() {
    if (!projectRoot) return onError("Open a Forge project before creating Blueprint examples.");
    try {
      for (const graph of createExampleGraphs()) {
        await commands.saveBlueprintGraph(projectRoot, graph);
      }
      await loadGraphs(projectRoot);
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <aside className="blueprint-explorer">
      <header>
        <div>
          <strong>Graph Browser</strong>
          <span>{projectRoot ? "Project graphs" : "No project open"}</span>
        </div>
        <IconButton label="Refresh graphs" onClick={() => projectRoot ? void loadGraphs(projectRoot).catch((error) => onError(String(error))) : undefined}><RefreshCw size={15} /></IconButton>
      </header>
      <div className="blueprint-explorer__actions">
        <CustomSelect value={graphType} options={[...graphTypes]} onChange={setGraphType} />
        <button className="blueprint-action" onClick={createNewGraph}><FilePlus2 size={15} />New Graph</button>
        <button className="blueprint-action" onClick={createExamples}><Copy size={15} />Create Examples</button>
      </div>
      <div className="blueprint-explorer__list">
        {graphs.length === 0 ? starterGraphs.map(([name, type, status]) => (
          <button key={name} className={name === "DoorSystem" ? "is-active" : ""} onClick={() => onError("Create example graphs first to open this starter graph from disk.")}>
            <GitBranch size={15} />
            <span>
              <strong>{name}</strong>
              <em>{type}</em>
            </span>
            <i className={`graph-status graph-status--${status}`} />
          </button>
        )) : null}
        {graphs.map((graph) => (
          <button key={graph.graphId} className={graph.graphId === activeGraph?.graphId ? "is-active" : ""} onClick={() => projectRoot ? void openGraph(projectRoot, graph.relativePath).catch((error) => onError(String(error))) : undefined}>
            <GitBranch size={15} />
            <span>
              <strong>{graph.name}</strong>
              <em>{graph.graphType}</em>
            </span>
            <i className={`graph-status graph-status--${activeGraph?.graphId === graph.graphId && diagnosticsTone()}`} />
          </button>
        ))}
      </div>
      <div className="my-graphs">
        <strong>My Graphs</strong>
        {[
          ["Functions", 3],
          ["Macros", 2],
          ["Variables", activeGraph?.variables.length ?? 0],
          ["Events", activeGraph?.nodes.filter((node) => node.type.startsWith("event.")).length ?? 0],
          ["Enums", 4],
          ["Structures", 6]
        ].map(([name, count]) => <button key={name}><span>{name}</span><b>{count}</b></button>)}
      </div>
      <footer>
        <IconButton label="Duplicate graph" disabled={!activeGraph} onClick={duplicateActive}><Copy size={15} /></IconButton>
        <IconButton label="Rename graph" disabled={!activeGraph} onClick={renameActive}><Pencil size={15} /></IconButton>
        <IconButton label="Delete graph" disabled={!activeGraph} onClick={deleteActive}><Trash2 size={15} /></IconButton>
      </footer>
    </aside>
  );

  function diagnosticsTone() {
    return "compiled";
  }
}
