import { AnimatePresence, motion } from "framer-motion";
import { Bot, Database, FilePlus2, Layers3, Lock, MessageSquare, Play, Send, Shield, Sparkles, Wand2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { commands } from "../../lib/tauri";
import { useAssetStore } from "../../stores/useAssetStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { AiCompatibilityReport, AiContext, AiPermissionSet, AiProposedAction, InstalledModel } from "../../types/ai";
import { formatBytes } from "../../lib/formatBytes";
import { PillButton } from "../shared/PillButton";

type AiTab = "setup" | "chat" | "actions" | "models" | "permissions" | "logs";
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

interface WerseeAIModalProps {
  open: boolean;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function WerseeAIModal({ open, onClose, onError, onSuccess }: WerseeAIModalProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const assetIndex = useAssetStore((state) => state.assetIndex);
  const [tab, setTab] = useState<AiTab>("setup");
  const [report, setReport] = useState<AiCompatibilityReport | null>(null);
  const [models, setModels] = useState<InstalledModel[]>([]);
  const [permissions, setPermissions] = useState<AiPermissionSet | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState<AiContext | null>(null);
  const [actions, setActions] = useState<AiProposedAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask me to inspect the current scene, build Blueprint logic, adjust selected objects, create Forge Script, tune worlds, or make characters playable. I will propose safe actions before changing files."
    }
  ]);
  const [busy, setBusy] = useState(false);

  const activeModel = useMemo(() => models.find((model) => model.active) ?? models[0] ?? null, [models]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open]);

  async function refresh() {
    try {
      const [deviceReport, installedModels, permissionSet, aiLogs] = await Promise.all([
        commands.aiProbeDevice(),
        commands.aiListInstalledModels(),
        commands.aiGetPermissions(),
        commands.aiGetLogs()
      ]);
      setReport(deviceReport);
      setModels(installedModels);
      setPermissions(permissionSet);
      setLogs(aiLogs);
    } catch (error) {
      onError(String(error));
    }
  }

  async function importModel() {
    const files = await commands.chooseFiles();
    const file = files.find((path) => path.toLowerCase().endsWith(".gguf"));
    if (!file) return;
    try {
      const imported = await commands.aiImportModel(file);
      setModels(await commands.aiListInstalledModels());
      onSuccess(`Imported ${imported.metadata.name}.`);
    } catch (error) {
      onError(String(error));
    }
  }

  async function selectModel(modelId: string) {
    try {
      await commands.aiSelectModel(modelId);
      setModels(await commands.aiListInstalledModels());
      onSuccess("Wersee AI model selected.");
    } catch (error) {
      onError(String(error));
    }
  }

  async function loadModel(modelId: string) {
    try {
      const handle = await commands.aiLoadModel(modelId);
      if (handle.loaded) {
        onSuccess(`Local AI runtime ready: ${handle.backend}`);
      } else {
        onError("Model is installed, but Forge local AI runner is missing. Put forge_ai_runner.exe or llama-cli.exe in AI/Runtime.");
      }
    } catch (error) {
      onError(String(error));
    }
  }

  async function buildContext(userPrompt = prompt) {
    const built = await commands.aiBuildContext({
      projectRoot: currentProject?.rootPath ?? null,
      selectedEntityJson: selectedSceneObject ? JSON.stringify(selectedSceneObject) : null,
      activeLevelJson: activeLevel ? JSON.stringify(activeLevel) : null,
      assetIndexJson: assetIndex ? JSON.stringify(assetIndex) : null,
      activeBlueprintGraphJson: null,
      activeFilePath: null,
      diagnostics: [],
      userIntent: userPrompt
    });
    setContext(built);
    return built;
  }

  async function submitPrompt(nextPrompt = prompt) {
    const userPrompt = nextPrompt.trim();
    if (!userPrompt) return;
    setBusy(true);
    setPrompt("");
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: userPrompt }]);
    try {
      const built = await buildContext(userPrompt);
      const proposed = await commands.aiProposeActions(userPrompt, built);
      setActions(proposed);
      try {
        const result = await commands.aiGenerate(
          { system: "Wersee AI for Forge", user: userPrompt, context: built.summary },
          { maxTokens: 512, temperature: 0.4, stream: false, localOnly: permissions?.localOnly ?? true }
        );
        setMessages((items) => [
          ...items,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: `${result.text}\n\nProposed actions: ${proposed.length}. Review them in the Actions tab before applying.`
          }
        ]);
      } catch (error) {
        const fallback = `Local inference is not active: ${String(error)}\n\nForge still built ${proposed.length} safe action proposal(s) from real editor context.`;
        setMessages((items) => [...items, { id: crypto.randomUUID(), role: "system", text: fallback }]);
      }
    } catch (error) {
      onError(String(error));
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "system", text: String(error) }]);
    } finally {
      setBusy(false);
    }
  }

  async function applyAction(action: AiProposedAction) {
    try {
      const applied = await commands.aiApplyAction(action.actionId);
      if (currentProject && activeLevel && applied.levelPath && ["update_scene_object", "create_scene_object"].includes(applied.operation)) {
        const refreshed = await commands.openLevel(currentProject.rootPath, applied.levelPath);
        setActiveLevel(refreshed);
      }
      setActions((items) => items.map((item) => item.actionId === applied.actionId ? applied : item));
      onSuccess(applied.result ?? `Applied ${applied.title}.`);
    } catch (error) {
      onError(String(error));
    }
  }

  async function updatePermissions(next: AiPermissionSet) {
    setPermissions(await commands.aiSetPermissions(next));
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal modal--wide wersee-ai-modal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <div>
                <h2><Sparkles size={18} /> Wersee AI for Forge</h2>
                <span>{permissions?.localOnly ? "Offline local mode" : "Cloud fallback allowed"} - {activeModel ? activeModel.metadata.name : "No model selected"}</span>
              </div>
              <button className="icon-button" aria-label="Close Wersee AI" onClick={onClose}><X size={18} /></button>
            </div>
            <div className="wersee-ai-tabs">
              <Tab id="setup" tab={tab} setTab={setTab} icon={<Shield size={14} />} label="Setup" />
              <Tab id="chat" tab={tab} setTab={setTab} icon={<MessageSquare size={14} />} label="Chat" />
              <Tab id="actions" tab={tab} setTab={setTab} icon={<Wand2 size={14} />} label="Actions" />
              <Tab id="models" tab={tab} setTab={setTab} icon={<Database size={14} />} label="Models" />
              <Tab id="permissions" tab={tab} setTab={setTab} icon={<Lock size={14} />} label="Permissions" />
              <Tab id="logs" tab={tab} setTab={setTab} icon={<FilePlus2 size={14} />} label="Logs" />
            </div>
            <div className="wersee-ai-body">
              {tab === "setup" ? <Setup report={report} models={models} onImport={importModel} onSelect={selectModel} onLoad={loadModel} /> : null}
              {tab === "chat" ? (
                <section className="wersee-ai-panel">
                  <div className="wersee-chat-header">
                    <div>
                      <h3>Forge AI Chat</h3>
                      <span>{context ? "Scene context ready" : "Context builds when you ask"}</span>
                    </div>
                    <button className="wersee-ai-context-pill" onClick={() => void buildContext()} disabled={busy}>
                      <Layers3 size={14} />
                      {activeLevel ? `${activeLevel.objects.length} objects` : "No scene"}
                    </button>
                  </div>
                  <div className="wersee-context-strip">
                    <span>{selectedSceneObject ? `Selected: ${selectedSceneObject.name}` : "No selected object"}</span>
                    <span>{assetIndex ? `${assetIndex.assets.length} assets` : "No asset index"}</span>
                    <span>{actions.length} proposed action(s)</span>
                    <span>{permissions?.localOnly ? "Local-only" : "Cloud allowed"}</span>
                  </div>
                  <div className="wersee-chat-messages" aria-live="polite">
                    {messages.map((message) => (
                      <article key={message.id} className={`wersee-chat-message wersee-chat-message--${message.role}`}>
                        <b>{message.role === "user" ? "You" : message.role === "assistant" ? "Wersee AI" : "Forge"}</b>
                        <p>{message.text}</p>
                      </article>
                    ))}
                    {busy ? (
                      <article className="wersee-chat-message wersee-chat-message--system">
                        <b>Forge</b>
                        <p>Building real project context and checking local tools...</p>
                      </article>
                    ) : null}
                  </div>
                  <div className="wersee-chat-quick">
                    {[
                      "Make the selected object bigger and explain the change.",
                      "Create a door interaction Blueprint for the current scene.",
                      "Find issues in this scene and propose fixes.",
                      "Generate Forge Script for the selected object."
                    ].map((item) => (
                      <button key={item} disabled={busy} onClick={() => void submitPrompt(item)}>{item}</button>
                    ))}
                  </div>
                  <div className="wersee-chat-composer">
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                          event.preventDefault();
                          void submitPrompt();
                        }
                      }}
                      placeholder="Ask Wersee AI to edit the selected object, create Blueprint logic, fix scripts, tune worlds, or inspect the scene..."
                    />
                    <button disabled={busy || !prompt.trim()} onClick={() => void submitPrompt()} aria-label="Send AI prompt">
                      {busy ? <Bot size={17} /> : <Send size={17} />}
                    </button>
                  </div>
                  <small className="wersee-chat-hint">Ctrl+Enter to send. File or scene changes still require Apply in Actions.</small>
                </section>
              ) : null}
              {tab === "actions" ? <Actions actions={actions} onApply={applyAction} onReject={async (id) => { await commands.aiRejectAction(id); setActions(actions.filter((action) => action.actionId !== id)); }} /> : null}
              {tab === "models" ? <ModelManager models={models} onImport={importModel} onSelect={selectModel} onLoad={loadModel} /> : null}
              {tab === "permissions" && permissions ? <Permissions permissions={permissions} onChange={updatePermissions} /> : null}
              {tab === "logs" ? <Logs logs={logs} onRefresh={refresh} onClear={async () => { await commands.aiClearLogs(); setLogs([]); }} /> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Tab({ id, tab, setTab, icon, label }: { id: AiTab; tab: AiTab; setTab: (tab: AiTab) => void; icon: ReactNode; label: string }) {
  return <button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{icon}{label}</button>;
}

function Setup({ report, models, onImport, onSelect, onLoad }: { report: AiCompatibilityReport | null; models: InstalledModel[]; onImport: () => void; onSelect: (id: string) => void; onLoad: (id: string) => void }) {
  return (
    <section className="wersee-ai-panel">
      <h3>Local AI Setup</h3>
      <div className="wersee-ai-cards">
        <Info label="Device tier" value={report?.deviceTier ?? "Detecting"} />
        <Info label="Recommended pack" value={report?.recommendedPack ?? "Detecting"} />
        <Info label="RAM" value={report ? `${report.hardware.ramGb} GB` : "Unknown"} />
        <Info label="GPU" value={report?.hardware.gpuName ?? "Not detected"} />
      </div>
      <p>{report?.expectedPerformance ?? "Checking hardware compatibility..."}</p>
      {report?.warnings.map((warning) => <p className="wersee-ai-warning" key={warning}>{warning}</p>)}
      <div className="wersee-ai-row">
        <PillButton active onClick={onImport}>Import GGUF</PillButton>
        {models[0] ? <PillButton onClick={() => onSelect(models[0].modelId)}>Select First Model</PillButton> : null}
        {models[0] ? <PillButton onClick={() => onLoad(models[0].modelId)} icon={<Play size={15} />}>Load Model</PillButton> : null}
      </div>
    </section>
  );
}

function ModelManager({ models, onImport, onSelect, onLoad }: { models: InstalledModel[]; onImport: () => void; onSelect: (id: string) => void; onLoad: (id: string) => void }) {
  return (
    <section className="wersee-ai-panel">
      <h3>Model Manager</h3>
      <PillButton active onClick={onImport}>Import GGUF Model</PillButton>
      <div className="wersee-ai-model-list">
        {models.map((model) => (
          <article key={model.modelId}>
            <strong>{model.metadata.name}</strong>
            <span>{model.metadata.family} - {model.metadata.parameterSize} - {model.metadata.quantization} - {formatBytes(model.sizeBytes)}</span>
            <small>{model.modelPath}</small>
            <div className="wersee-ai-row">
              <PillButton active={model.active} onClick={() => onSelect(model.modelId)}>{model.active ? "Active" : "Select"}</PillButton>
              <PillButton onClick={() => onLoad(model.modelId)}>Load</PillButton>
            </div>
          </article>
        ))}
        {models.length === 0 ? <p>No local GGUF models installed.</p> : null}
      </div>
    </section>
  );
}

function Actions({ actions, onApply, onReject }: { actions: AiProposedAction[]; onApply: (action: AiProposedAction) => void; onReject: (id: string) => void }) {
  return (
    <section className="wersee-ai-panel">
      <h3>Proposed Actions</h3>
      {actions.map((action) => (
        <article className="wersee-ai-action" key={action.actionId}>
          <strong>{action.title}</strong>
          <span>{action.description}</span>
          <small>{action.operation} - {action.target} - risk {action.risk}</small>
          {action.after ? <code>{action.after}</code> : null}
          {action.applied ? <em>{action.result ?? "Applied"}</em> : null}
          <div className="wersee-ai-row">
            <PillButton active disabled={action.applied} onClick={() => onApply(action)}>{action.applied ? "Applied" : "Apply"}</PillButton>
            <PillButton onClick={() => onReject(action.actionId)}>Reject</PillButton>
          </div>
        </article>
      ))}
      {actions.length === 0 ? <p>No actions proposed yet.</p> : null}
    </section>
  );
}

function Permissions({ permissions, onChange }: { permissions: AiPermissionSet; onChange: (permissions: AiPermissionSet) => void }) {
  const toggles: Array<[keyof AiPermissionSet, string]> = [
    ["allowReadScene", "Read scene"],
    ["allowEditScene", "Edit scene"],
    ["allowEditScripts", "Edit Forge Script"],
    ["allowEditBlueprints", "Edit Blueprints"],
    ["allowCreateAssets", "Create assets"],
    ["allowProjectAnalysis", "Project analysis"],
    ["requireConfirmation", "Require confirmation"],
    ["localOnly", "Local-only offline mode"],
    ["cloudEnabled", "Cloud/API fallback"]
  ];
  return (
    <section className="wersee-ai-panel">
      <h3>Permissions</h3>
      <div className="toggle-grid">
        {toggles.map(([key, label]) => (
          <label className="checkbox-row" key={String(key)}>
            <input type="checkbox" checked={Boolean(permissions[key])} onChange={(event) => onChange({ ...permissions, [key]: event.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function Logs({ logs, onRefresh, onClear }: { logs: string[]; onRefresh: () => void; onClear: () => void }) {
  return (
    <section className="wersee-ai-panel">
      <h3>Logs</h3>
      <div className="wersee-ai-row"><PillButton onClick={onRefresh}>Refresh</PillButton><PillButton onClick={onClear}>Clear</PillButton></div>
      <pre>{logs.length ? logs.join("\n") : "No AI logs yet."}</pre>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
