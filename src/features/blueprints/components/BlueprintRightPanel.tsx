import { useState } from "react";
import { BlueprintAISidebar } from "./BlueprintAISidebar";
import { BlueprintInspector } from "./BlueprintInspector";
import { NodeLibrary } from "./NodeLibrary";

interface BlueprintRightPanelProps {
  projectRoot: string | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BlueprintRightPanel({ projectRoot, onError, onSuccess }: BlueprintRightPanelProps) {
  const [tab, setTab] = useState<"AI" | "Library" | "Inspector">("Inspector");

  return (
    <aside className="blueprint-right-panel">
      <div className="blueprint-right-panel__tabs">
        {(["AI", "Library", "Inspector"] as const).map((item) => (
          <button key={item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "AI" ? <BlueprintAISidebar projectRoot={projectRoot} onError={onError} onSuccess={onSuccess} /> : null}
      {tab === "Library" ? <NodeLibrary /> : null}
      {tab === "Inspector" ? <BlueprintInspector /> : null}
    </aside>
  );
}
