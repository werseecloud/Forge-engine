import { ChevronRight, Home } from "lucide-react";
import { useAssetStore } from "../../stores/useAssetStore";

export function Breadcrumbs() {
  const currentFolder = useAssetStore((state) => state.currentFolder);
  const setCurrentFolder = useAssetStore((state) => state.setCurrentFolder);
  const parts = currentFolder ? currentFolder.split("/").filter(Boolean) : [];

  return (
    <div className="breadcrumbs">
      <button onClick={() => setCurrentFolder("")}><Home size={14} /> Content</button>
      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join("/");
        return (
          <span key={path}>
            <ChevronRight size={13} />
            <button onClick={() => setCurrentFolder(path)}>{part}</button>
          </span>
        );
      })}
    </div>
  );
}

