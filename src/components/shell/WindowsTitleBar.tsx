import { getCurrentWindow } from "@tauri-apps/api/window";
import { Bot, Box, Braces, Code2, Edit3, History, Minus, Package, Plug, RotateCcw, Settings2, Sparkles, Square, Undo2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";

export function WindowsTitleBar({ onOpenAI }: { onOpenAI: () => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const currentProject = useProjectStore((state) => state.currentProject);
  const setActiveContentTab = useAppStore((state) => state.setActiveContentTab);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const canUseTauriWindow = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const appWindow = canUseTauriWindow ? getCurrentWindow() : null;
  const title = currentProject ? `Forge Engine 1.0.0 - ${currentProject.projectName}` : "Forge Engine 1.0.0";

  function resetScene() {
    if (!activeLevel) return;
    setActiveLevel({ ...activeLevel, objects: [] });
    setOpenMenu(null);
  }

  function openTab(tab: "Content Browser" | "Blueprints") {
    setActiveContentTab(tab);
    setOpenMenu(null);
  }

  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar__brand" data-tauri-drag-region>
        <div className="forge-mark">F</div>
        <span>{title}</span>
      </div>
      <nav className="title-menu" data-tauri-drag-region={false}>
        <HeaderMenu label="Edit" icon={<Edit3 size={13} />} open={openMenu === "edit"} onToggle={() => setOpenMenu(openMenu === "edit" ? null : "edit")}>
          <MenuButton icon={<Undo2 size={14} />} label="Undo" hint="Ctrl+Z" onClick={() => setOpenMenu(null)} />
          <MenuButton icon={<History size={14} />} label="Redo" hint="Ctrl+Y" onClick={() => setOpenMenu(null)} />
          <MenuButton icon={<RotateCcw size={14} />} label="Reset Scene" disabled={!activeLevel} onClick={resetScene} />
        </HeaderMenu>
        <HeaderMenu label="AI" icon={<Sparkles size={13} />} open={openMenu === "ai"} onToggle={() => setOpenMenu(openMenu === "ai" ? null : "ai")}>
          <MenuButton icon={<Bot size={14} />} label="Open AI Modal" hint="Ctrl+I" onClick={() => { setOpenMenu(null); onOpenAI(); }} />
          <MenuButton icon={<Settings2 size={14} />} label="AI Settings" onClick={() => { setOpenMenu(null); onOpenAI(); }} />
          <MenuButton icon={<Package size={14} />} label="Local AI Installer" onClick={() => { setOpenMenu(null); onOpenAI(); }} />
        </HeaderMenu>
        <HeaderMenu label="Screens" icon={<Box size={13} />} open={openMenu === "screens"} onToggle={() => setOpenMenu(openMenu === "screens" ? null : "screens")}>
          <MenuButton icon={<Code2 size={14} />} label="Code" onClick={() => openTab("Content Browser")} />
          <MenuButton icon={<Braces size={14} />} label="Blueprints" onClick={() => openTab("Blueprints")} />
          <MenuButton icon={<Package size={14} />} label="Assets" onClick={() => openTab("Content Browser")} />
        </HeaderMenu>
        <HeaderMenu label="Plugins" icon={<Plug size={13} />} open={openMenu === "plugins"} onToggle={() => setOpenMenu(openMenu === "plugins" ? null : "plugins")}>
          <MenuButton icon={<Plug size={14} />} label="Plugin Browser" onClick={() => setOpenMenu(null)} />
          <MenuButton icon={<Package size={14} />} label="Install Local Plugin" onClick={() => setOpenMenu(null)} />
        </HeaderMenu>
      </nav>
      <div className="window-controls">
        <button aria-label="Minimize" onClick={() => void appWindow?.minimize()}><Minus size={15} /></button>
        <button aria-label="Maximize" onClick={() => void appWindow?.toggleMaximize()}><Square size={13} /></button>
        <button aria-label="Close" onClick={() => void appWindow?.close()}><X size={16} /></button>
      </div>
    </div>
  );
}

function HeaderMenu({ label, icon, open, onToggle, children }: { label: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="title-menu__item">
      <button className={open ? "title-menu__button is-open" : "title-menu__button"} onClick={onToggle}>
        {icon}
        <span>{label}</span>
      </button>
      {open ? <div className="title-dropdown">{children}</div> : null}
    </div>
  );
}

function MenuButton({ icon, label, hint, disabled, onClick }: { icon: ReactNode; label: string; hint?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="title-dropdown__button" disabled={disabled} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {hint ? <em>{hint}</em> : null}
    </button>
  );
}
