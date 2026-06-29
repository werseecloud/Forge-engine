import { useAppStore } from "../../stores/useAppStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { EmptyState } from "../shared/EmptyState";
import { AssetInspector } from "./AssetInspector";
import { InspectorSection } from "./InspectorSection";
import { SceneObjectInspector } from "./SceneObjectInspector";

interface InspectorProps {
  onError: (message: string) => void;
}

export function Inspector({ onError }: InspectorProps) {
  const selectedAsset = useAppStore((state) => state.selectedAsset);
  const selectedEntity = useAppStore((state) => state.selectedEntity);
  const activeLevel = useSceneStore((state) => state.activeLevel);

  if (selectedAsset) {
    return <AssetInspector asset={selectedAsset} onError={onError} />;
  }

  if (selectedEntity) {
    return <SceneObjectInspector object={selectedEntity} onError={onError} />;
  }

  if (activeLevel) {
    return (
      <div className="inspector-content">
        <div className="inspector-heading">
          <strong>{activeLevel.name}</strong>
          <span>Active Level</span>
        </div>
        <InspectorSection title="Level Metadata">
          <div className="detail-grid">
            <span>Path</span><strong>{activeLevel.path}</strong>
            <span>Objects</span><strong>{activeLevel.objects.length}</strong>
            <span>Layers</span><strong>{activeLevel.layers.length}</strong>
            <span>Updated</span><strong>{activeLevel.updatedAt}</strong>
          </div>
        </InspectorSection>
      </div>
    );
  }

  return <EmptyState title="Nothing selected" detail="Select an asset, level, or scene object to inspect real data." />;
}

