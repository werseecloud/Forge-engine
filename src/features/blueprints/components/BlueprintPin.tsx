import type { BlueprintPin as BlueprintPinType } from "../types/blueprint-types";
import { useBlueprintStore } from "../state/blueprintStore";

interface BlueprintPinProps {
  nodeId: string;
  pin: BlueprintPinType;
}

export function BlueprintPin({ nodeId, pin }: BlueprintPinProps) {
  const beginConnection = useBlueprintStore((state) => state.beginConnection);
  const completeConnection = useBlueprintStore((state) => state.completeConnection);
  const pendingConnection = useBlueprintStore((state) => state.pendingConnection);
  const isPending = pendingConnection?.nodeId === nodeId && pendingConnection.pinId === pin.id;

  return (
    <button
      className={`blueprint-pin blueprint-pin--${pin.direction} blueprint-pin--${pin.pinKind} blueprint-pin--${pin.dataType.toLowerCase()} ${isPending ? "is-pending" : ""}`}
      title={`${pin.name} • ${pin.dataType}`}
      onPointerDown={(event) => {
        event.stopPropagation();
        beginConnection(nodeId, pin.id, pin.direction);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        completeConnection(nodeId, pin.id, pin.direction);
      }}
    >
      <span />
      <em>{pin.name}</em>
    </button>
  );
}
