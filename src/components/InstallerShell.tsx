import type { ReactNode } from "react";
import { InstallerTitleBar } from "./InstallerTitleBar";
import { StepSidebar } from "./StepSidebar";

export function InstallerShell({ children }: { children: ReactNode }) {
  return (
    <div className="setup-window">
      <InstallerTitleBar />
      <div className="setup-body">
        <StepSidebar />
        <main className="screen-panel">{children}</main>
      </div>
    </div>
  );
}

