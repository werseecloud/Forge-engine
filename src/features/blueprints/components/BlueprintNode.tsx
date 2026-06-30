import { memo, useRef } from "react";
import type { PointerEvent } from "react";
import { AlertTriangle, Bug, CircleOff } from "lucide-react";
import type { BlueprintNode as BlueprintNodeType } from "../types/blueprint-types";
import { findNodeDefinition } from "../data/nodeRegistry";
import { useBlueprintStore } from "../state/blueprintStore";
import { BlueprintPin } from "./BlueprintPin";

interface BlueprintNodeProps {
  node: BlueprintNodeType;
  selected: boolean;
  debugActive: boolean;
}

export const BlueprintNode = memo(function BlueprintNode({ node, selected, debugActive }: BlueprintNodeProps) {
  const selectNode = useBlueprintStore((state) => state.selectNode);
  const moveNode = useBlueprintStore((state) => state.moveNode);
  const diagnostics = useBlueprintStore((state) => state.diagnostics);
  const drag = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const definition = findNodeDefinition(node.type);
  const hasError = diagnostics.some((diag) => diag.nodeId === node.id && diag.severity === "error");
  const hasWarning = diagnostics.some((diag) => diag.nodeId === node.id && diag.severity === "warning");

  function onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    selectNode(node.id, event.shiftKey);
    drag.current = { startX: event.clientX, startY: event.clientY, nodeX: node.position.x, nodeY: node.position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag.current) return;
    moveNode(node.id, {
      x: drag.current.nodeX + event.clientX - drag.current.startX,
      y: drag.current.nodeY + event.clientY - drag.current.startY
    });
  }

  function onPointerUp(event: PointerEvent) {
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <article
      className={`blueprint-node ${selected ? "is-selected" : ""} ${debugActive ? "is-debug-active" : ""} ${hasError ? "has-error" : ""}`}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, ["--node-color" as string]: definition?.color ?? "#8E8E93" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={String(node.metadata.description ?? definition?.description ?? node.title)}
    >
      <header>
        <b>{definition?.icon ?? "?"}</b>
        <div>
          <strong>{node.title}</strong>
          <span>{node.category}</span>
        </div>
        {node.breakpointEnabled ? <Bug size={14} /> : null}
        {node.disabled ? <CircleOff size={14} /> : null}
        {hasWarning || hasError ? <AlertTriangle size={14} /> : null}
      </header>
      <div className="blueprint-node__pins">
        <div>{node.inputs.map((pin) => <BlueprintPin key={pin.id} nodeId={node.id} pin={pin} />)}</div>
        <div>{node.outputs.map((pin) => <BlueprintPin key={pin.id} nodeId={node.id} pin={pin} />)}</div>
      </div>
      {node.comment ? <p>{node.comment}</p> : null}
    </article>
  );
});
