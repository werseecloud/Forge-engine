import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, X } from "lucide-react";

export function InstallerTitleBar() {
  const canUseTauriWindow = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const win = canUseTauriWindow ? getCurrentWindow() : null;
  return (
    <div className="installer-titlebar" data-tauri-drag-region>
      <div className="title-brand" data-tauri-drag-region><span className="mini-logo">F</span>Forge Engine Setup</div>
      <div className="title-buttons">
        <button onClick={() => void win?.minimize()} aria-label="Minimize"><Minus size={14} /></button>
        <button onClick={() => void win?.close()} aria-label="Close"><X size={15} /></button>
      </div>
    </div>
  );
}
