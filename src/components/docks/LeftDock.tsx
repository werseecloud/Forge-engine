import { useState } from "react";
import { LevelsPanel } from "../outliner/LevelsPanel";
import { WorldLayersPanel } from "../outliner/WorldLayersPanel";
import { WorldOutliner } from "../outliner/WorldOutliner";

interface LeftDockProps {
  onCreateLevel: () => void;
}

export function LeftDock({ onCreateLevel }: LeftDockProps) {
  const [tab, setTab] = useState<"outliner" | "levels">("outliner");

  return (
    <aside className="dock left-dock">
      <div className="dock-tabs">
        <button className={tab === "outliner" ? "is-active" : ""} onClick={() => setTab("outliner")}>World Outliner</button>
        <button className={tab === "levels" ? "is-active" : ""} onClick={() => setTab("levels")}>Levels</button>
      </div>
      <div className="dock-body">
        {tab === "outliner" ? <WorldOutliner onCreateLevel={onCreateLevel} /> : <LevelsPanel onCreateLevel={onCreateLevel} />}
      </div>
      <div className="dock-lower">
        <WorldLayersPanel />
      </div>
    </aside>
  );
}

