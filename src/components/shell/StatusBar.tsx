import { Circle, FolderGit2 } from "lucide-react";
import type { WatcherStatus } from "../../types/fs";
import { useAssetStore } from "../../stores/useAssetStore";
import { useProjectStore } from "../../stores/useProjectStore";

interface StatusBarProps {
  fps: number;
  watcher: WatcherStatus | null;
  lastImportStatus: string;
}

export function StatusBar({ fps, watcher, lastImportStatus }: StatusBarProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const assetIndex = useAssetStore((state) => state.assetIndex);

  return (
    <div className="status-bar">
      <span>Forge Engine 1.0.0</span>
      <span className="status-bar__wide">{currentProject?.rootPath ?? "No project path"}</span>
      <span><Circle size={10} className={watcher?.active ? "status-ok" : "status-muted"} /> Watcher: {watcher?.mode ?? "inactive"}</span>
      <span><Circle size={10} className={assetIndex ? "status-ok" : "status-muted"} /> Assets: {assetIndex?.assets.length ?? 0}</span>
      <span>{lastImportStatus || "No imports this session"}</span>
      <span><FolderGit2 size={14} /> Source control local</span>
      <strong>{fps} FPS</strong>
    </div>
  );
}

