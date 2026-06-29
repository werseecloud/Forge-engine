import { Play, Plus, SkipForward } from "lucide-react";
import { useMemo, useState } from "react";
import { useSceneStore } from "../../stores/useSceneStore";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";

export function AnimationTimeline() {
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const animatedObjects = useMemo(
    () => (activeLevel?.objects ?? []).filter((object) => object.components.some((component) => component.componentType.toLowerCase().includes("animation"))),
    [activeLevel?.objects]
  );
  const [time, setTime] = useState(0);

  if (!activeLevel) {
    return <EmptyState title="No level loaded" detail="Open a level to edit animation tracks." />;
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-toolbar">
        <IconButton label="Play timeline"><Play size={14} /></IconButton>
        <IconButton label="Step keyframe" onClick={() => setTime((value) => Math.min(120, value + 1))}><SkipForward size={14} /></IconButton>
        <IconButton label="Add animation track" disabled={!selectedSceneObject}><Plus size={14} /></IconButton>
        <span>{selectedSceneObject ? selectedSceneObject.name : "No object selected"}</span>
      </div>
      <div className="timeline-ruler">
        <input type="range" min="0" max="120" value={time} onChange={(event) => setTime(Number(event.target.value))} />
        <strong>{time}f</strong>
      </div>
      <div className="timeline-tracks">
        {animatedObjects.length === 0 ? (
          <div className="inline-empty">No animation components in this level yet.</div>
        ) : (
          animatedObjects.map((object) => (
            <div key={object.id} className="timeline-track">
              <span>{object.name}</span>
              <div><b style={{ left: `${Math.min(96, time)}%` }} /></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
