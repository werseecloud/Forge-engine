import { useState } from "react";
import { BlueprintInspector } from "./BlueprintInspector";
import { NodeLibrary } from "./NodeLibrary";

export function BlueprintRightPanel() {
  const [tab, setTab] = useState<"Library" | "Inspector">("Inspector");

  return (
    <aside className="blueprint-right-panel">
      <div className="blueprint-right-panel__tabs">
        {(["Library", "Inspector"] as const).map((item) => (
          <button key={item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "Library" ? <NodeLibrary /> : <BlueprintInspector />}
    </aside>
  );
}
