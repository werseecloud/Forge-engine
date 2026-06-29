import { useMemo } from "react";
import { useAssetStore } from "../../stores/useAssetStore";
import { AssetGrid } from "./AssetGrid";

export function BlueprintsPanel() {
  const assetIndex = useAssetStore((state) => state.assetIndex);
  const thumbnailSize = useAssetStore((state) => state.thumbnailSize);
  const blueprints = useMemo(() => (assetIndex?.assets ?? []).filter((asset) => asset.assetType === "Blueprint"), [assetIndex?.assets]);

  return (
    <div className="single-panel-content">
      <AssetGrid
        assets={blueprints}
        thumbnailSize={thumbnailSize}
        emptyTitle="No blueprints yet"
        emptyDetail="Create a blueprint or import one into the project Content folder."
      />
    </div>
  );
}

