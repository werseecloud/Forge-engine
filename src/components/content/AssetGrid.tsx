import type { AssetMetadata } from "../../types/asset";
import { EmptyState } from "../shared/EmptyState";
import { AssetCard } from "./AssetCard";

interface AssetGridProps {
  assets: AssetMetadata[];
  thumbnailSize: number;
  emptyTitle?: string;
  emptyDetail?: string;
}

export function AssetGrid({ assets, thumbnailSize, emptyTitle = "This folder is empty", emptyDetail = "Import assets or create folders inside this project Content directory." }: AssetGridProps) {
  if (assets.length === 0) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <div className="asset-grid">
      {assets.map((asset) => <AssetCard key={asset.assetId} asset={asset} size={thumbnailSize} />)}
    </div>
  );
}

