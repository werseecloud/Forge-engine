import { useAppStore } from "../../stores/useAppStore";
import { useSceneStore } from "../../stores/useSceneStore";

interface ViewportOverlayProps {
  fps: number;
}

export function ViewportOverlay({ fps }: ViewportOverlayProps) {
  const selectedEntity = useAppStore((state) => state.selectedEntity);
  const activeLevel = useSceneStore((state) => state.activeLevel);

  return (
    <div className="viewport-overlay">
      <div className="viewport-overlay__left">
        <span>{activeLevel ? activeLevel.name : "No level loaded"}</span>
        {selectedEntity ? <strong>{selectedEntity.name}</strong> : null}
      </div>
      <div className="viewport-overlay__right">
        <strong>{fps} FPS</strong>
      </div>
    </div>
  );
}

