import { FileBox, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes, formatDate } from "../../lib/formatters";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import type { AssetMetadata } from "../../types/asset";
import { PillButton } from "../shared/PillButton";
import { InspectorSection } from "./InspectorSection";

interface AssetInspectorProps {
  asset: AssetMetadata;
  onError: (message: string) => void;
}

export function AssetInspector({ asset, onError }: AssetInspectorProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const selectAsset = useAppStore((state) => state.selectAsset);
  const [tags, setTags] = useState(asset.tags.join(", "));

  useEffect(() => setTags(asset.tags.join(", ")), [asset.assetId]);

  async function save() {
    if (!currentProject) return;
    try {
      const saved = await commands.updateAssetMetadata(currentProject.rootPath, asset.relativePath, {
        ...asset,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      });
      selectAsset(saved);
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <div className="inspector-heading__icon"><FileBox size={18} /></div>
        <div className="inspector-heading__main">
          <strong>{asset.fileName}</strong>
          <span>{asset.assetType}</span>
        </div>
        <div className="inspector-heading__meta">
          <b>{asset.extension.toUpperCase()}</b>
          <b>{formatBytes(asset.fileSize)}</b>
        </div>
      </div>
      <InspectorSection title="Metadata">
        <div className="detail-grid">
          <span>Path</span><strong>{asset.relativePath}</strong>
          <span>Size</span><strong>{formatBytes(asset.fileSize)}</strong>
          <span>Modified</span><strong>{formatDate(asset.modifiedAt)}</strong>
          <span>Engine</span><strong>{asset.engineVersion}</strong>
        </div>
      </InspectorSection>
      <InspectorSection title="Tags">
        <label className="field-stack">
          <span>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="comma, separated" />
        </label>
        <PillButton active onClick={save} icon={<Save size={15} />}>Save Metadata</PillButton>
      </InspectorSection>
    </div>
  );
}
