import { useState } from "react";
import { EmptyState } from "../shared/EmptyState";
import { Inspector } from "../inspector/Inspector";

interface RightDockProps {
  onError: (message: string) => void;
}

export function RightDock({ onError }: RightDockProps) {
  const [tab, setTab] = useState<"inspector" | "services">("inspector");

  return (
    <aside className="dock right-dock">
      <div className="dock-tabs">
        <button className={tab === "inspector" ? "is-active" : ""} onClick={() => setTab("inspector")}>Inspector</button>
        <button className={tab === "services" ? "is-active" : ""} onClick={() => setTab("services")}>Services</button>
      </div>
      <div className="dock-body">
        {tab === "inspector" ? <Inspector onError={onError} /> : <EmptyState title="No services registered" detail="Runtime services will appear here when engine plugins expose them." />}
      </div>
    </aside>
  );
}

