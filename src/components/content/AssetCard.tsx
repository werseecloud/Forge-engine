import { iconForAsset } from "../../lib/assetTypes";
import { formatBytes, formatDate } from "../../lib/formatters";
import { useAppStore } from "../../stores/useAppStore";
import type { AssetMetadata } from "../../types/asset";

interface AssetCardProps {
  asset: AssetMetadata;
  size: number;
}

export function AssetCard({ asset, size }: AssetCardProps) {
  const selectedAsset = useAppStore((state) => state.selectedAsset);
  const selectAsset = useAppStore((state) => state.selectAsset);
  const Icon = iconForAsset(asset);
  const selected = selectedAsset?.assetId === asset.assetId;

  return (
    <button
      draggable
      className={selected ? "asset-card is-selected" : "asset-card"}
      style={{ width: size }}
      onClick={() => selectAsset(asset)}
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-forge-asset", asset.relativePath);
        event.dataTransfer.setData("text/plain", asset.relativePath);
      }}
    >
      <div className="asset-thumb">
        <Icon size={34} />
        <span>.{asset.extension}</span>
      </div>
      <strong title={asset.fileName}>{asset.fileName}</strong>
      <small>{asset.assetType} · {formatBytes(asset.fileSize)}</small>
      <small>{formatDate(asset.modifiedAt)}</small>
    </button>
  );
}

