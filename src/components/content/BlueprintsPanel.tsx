import { useMemo } from "react";
import { useAssetStore } from "../../stores/useAssetStore";
import { useAppStore } from "../../stores/useAppStore";
import { AssetGrid } from "./AssetGrid";

export function BlueprintsPanel() {
  const assetIndex = useAssetStore((state) => state.assetIndex);
  const thumbnailSize = useAssetStore((state) => state.thumbnailSize);
  const setActivePanel = useAppStore((state) => state.setActivePanel);
  const blueprints = useMemo(() => (assetIndex?.assets ?? []).filter((asset) => asset.assetType === "Blueprint"), [assetIndex?.assets]);

  return (
    <div className="single-panel-content">
      <div className="blueprints-panel-entry">
        <div>
          <strong>Forge Visual Graph</strong>
          <span>Open the full-screen node editor for gameplay logic.</span>
        </div>
        <button className="blueprint-action" onClick={() => setActivePanel("blueprints")}>Open Blueprints</button>
      </div>
      <AssetGrid
        assets={blueprints}
        thumbnailSize={thumbnailSize}
        emptyTitle="No blueprints yet"
        emptyDetail="Create a blueprint or import one into the project Content folder."
      />
    </div>
  );
}
