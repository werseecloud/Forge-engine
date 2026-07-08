import { Bot, CheckCircle2, Sparkles, Wand2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { commands } from "../../../lib/tauri";
import { useAssetStore } from "../../../stores/useAssetStore";
import { useSceneStore } from "../../../stores/useSceneStore";
import type { AiContext, AiProposedAction } from "../../../types/ai";
import type { BlueprintGraph } from "../types/blueprint-types";
import { useBlueprintStore } from "../state/blueprintStore";

interface BlueprintAISidebarProps {
  projectRoot: string | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const quickPrompts = [
  "Create a door interaction Blueprint: press E, branch, open door, play sound.",
  "Create a pickup item Blueprint that adds an item then destroys the pickup.",
  "Create a health system Blueprint with Health variable and damage handling.",
  "Create an enemy AI patrol Blueprint with line of sight and chase logic."
];

export function BlueprintAISidebar({ projectRoot, onError, onSuccess }: BlueprintAISidebarProps) {
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const assetIndex = useAssetStore((state) => state.assetIndex);
  const activeGraph = useBlueprintStore((state) => state.activeGraph);
  const diagnostics = useBlueprintStore((state) => state.diagnostics);
  const loadGraphs = useBlueprintStore((state) => state.loadGraphs);
  const setActiveGraph = useBlueprintStore((state) => state.setActiveGraph);
  const [prompt, setPrompt] = useState(quickPrompts[0]);
  const [context, setContext] = useState<AiContext | null>(null);
  const [actions, setActions] = useState<AiProposedAction[]>([]);
  const [busy, setBusy] = useState(false);

  const contextSummary = useMemo(() => {
    if (context) return context.summary;
    const parts = [
      activeLevel ? `${activeLevel.objects.length} scene objects` : "No active scene",
      activeGraph ? `${activeGraph.nodes.length} nodes in active graph` : "No active graph",
      assetIndex ? `${assetIndex.assets.length} assets indexed` : "No asset index"
    ];
    return parts.join(" / ");
  }, [activeGraph, activeLevel, assetIndex, context]);

  async function buildContext(nextPrompt = prompt) {
    if (!projectRoot) {
      throw new Error("Open a Forge project before using Blueprint AI.");
    }
    const built = await commands.aiBuildContext({
      projectRoot,
      selectedEntityJson: selectedSceneObject ? JSON.stringify(selectedSceneObject) : null,
      activeLevelJson: activeLevel ? JSON.stringify(activeLevel) : null,
      assetIndexJson: assetIndex ? JSON.stringify(assetIndex) : null,
      activeBlueprintGraphJson: activeGraph ? JSON.stringify(activeGraph) : null,
      activeFilePath: activeGraph ? `Content/Blueprints/${activeGraph.name}.forgegraph` : null,
      diagnostics: diagnostics.map((item) => `${item.severity}: ${item.message} ${item.recovery}`),
      userIntent: nextPrompt
    });
    setContext(built);
    return built;
  }

  async function generateBlueprint(nextPrompt = prompt) {
    setBusy(true);
    try {
      const built = await buildContext(nextPrompt);
      const proposed = await commands.aiProposeActions(
        nextPrompt.toLowerCase().includes("blueprint") ? nextPrompt : `${nextPrompt}\nCreate this as a Blueprint graph.`,
        built
      );
      const blueprintActions = proposed.filter((action) => action.operation.includes("blueprint") || action.toolName.includes("blueprint"));
      setActions(blueprintActions);
      if (blueprintActions.length === 0) {
        onError("Wersee AI did not return a Blueprint action.");
      }
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function applyAction(action: AiProposedAction) {
    if (!projectRoot) return onError("Open a Forge project before applying Blueprint AI actions.");
    setBusy(true);
    try {
      const applied = await commands.aiApplyAction(action.actionId);
      if (applied.result) {
        const graph = JSON.parse(applied.result) as BlueprintGraph;
        setActiveGraph(graph);
        await loadGraphs(projectRoot);
      }
      setActions((items) => items.map((item) => item.actionId === applied.actionId ? applied : item));
      onSuccess(applied.result ? "Blueprint generated and opened." : "Blueprint AI action applied.");
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function rejectAction(actionId: string) {
    await commands.aiRejectAction(actionId);
    setActions((items) => items.filter((item) => item.actionId !== actionId));
  }

  return (
    <section className="blueprint-ai-sidebar">
      <header>
        <div>
          <strong><Sparkles size={15} /> Wersee AI</strong>
          <span>Scene-aware Blueprint builder</span>
        </div>
      </header>

      <div className="blueprint-ai-sidebar__context">
        <b>Context</b>
        <p>{contextSummary}</p>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe the Blueprint you want Forge to build."
      />

      <div className="blueprint-ai-sidebar__quick">
        {quickPrompts.map((item) => (
          <button key={item} onClick={() => { setPrompt(item); void generateBlueprint(item); }}>
            {item}
          </button>
        ))}
      </div>

      <div className="blueprint-ai-sidebar__actions">
        <button className="blueprint-action blueprint-action--primary" disabled={busy || !projectRoot} onClick={() => void generateBlueprint()}>
          <Bot size={14} /> {busy ? "Working..." : "Generate Blueprint"}
        </button>
        <button className="blueprint-action" disabled={busy || !projectRoot} onClick={() => void buildContext().then(() => onSuccess("Blueprint AI context refreshed.")).catch((error) => onError(String(error)))}>
          <Wand2 size={14} /> Refresh Context
        </button>
      </div>

      <div className="blueprint-ai-sidebar__results">
        {actions.map((action) => (
          <article key={action.actionId}>
            <strong>{action.title}</strong>
            <span>{action.description}</span>
            <small>{action.operation} / {action.risk}</small>
            {action.after ? <code>{action.after}</code> : null}
            <footer>
              <button disabled={busy || action.applied} onClick={() => void applyAction(action)}><CheckCircle2 size={13} /> {action.applied ? "Applied" : "Apply"}</button>
              <button disabled={busy} onClick={() => void rejectAction(action.actionId)}><XCircle size={13} /> Reject</button>
            </footer>
          </article>
        ))}
        {actions.length === 0 ? <p>No Blueprint proposal yet.</p> : null}
      </div>
    </section>
  );
}
