import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";

export function WindowsTitleBar() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const appWindow = getCurrentWindow();
  const title = currentProject ? `Forge Engine 1.0.0 - ${currentProject.projectName}` : "Forge Engine 1.0.0";

  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar__brand" data-tauri-drag-region>
        <div className="forge-mark">F</div>
        <span>{title}</span>
      </div>
      <div className="window-controls">
        <button aria-label="Minimize" onClick={() => appWindow.minimize()}><Minus size={15} /></button>
        <button aria-label="Maximize" onClick={() => appWindow.toggleMaximize()}><Square size={13} /></button>
        <button aria-label="Close" onClick={() => appWindow.close()}><X size={16} /></button>
      </div>
    </div>
  );
}

