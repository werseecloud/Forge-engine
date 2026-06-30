import { useMemo, useRef } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { EmptyState } from "../../../components/shared/EmptyState";
import { useBlueprintStore } from "../state/blueprintStore";
import { BlueprintEdge } from "./BlueprintEdge";
import { BlueprintMinimap } from "./BlueprintMinimap";
import { BlueprintNode } from "./BlueprintNode";
import { NodeSearchMenu } from "./NodeSearchMenu";

export function BlueprintCanvas() {
  const graph = useBlueprintStore((state) => state.activeGraph);
  const selectedNodeIds = useBlueprintStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useBlueprintStore((state) => state.selectedEdgeIds);
  const runResult = useBlueprintStore((state) => state.runResult);
  const zoom = useBlueprintStore((state) => state.zoom);
  const pan = useBlueprintStore((state) => state.pan);
  const setViewport = useBlueprintStore((state) => state.setViewport);
  const selectNode = useBlueprintStore((state) => state.selectNode);
  const openSearch = useBlueprintStore((state) => state.openSearch);
  const clearConnection = useBlueprintStore((state) => state.clearConnection);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const activeNodeIds = useMemo(() => new Set((runResult?.traces ?? []).slice(-8).map((trace) => trace.nodeId)), [runResult?.traces]);

  if (!graph) {
    return (
      <section className="blueprint-canvas blueprint-canvas--empty">
        <EmptyState title="No Blueprint graph open" detail="Create or open a graph from the Graph Explorer." />
      </section>
    );
  }

  function toCanvasPoint(clientX: number, clientY: number, rect: DOMRect) {
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function onWheel(event: WheelEvent<HTMLElement>) {
    event.preventDefault();
    const nextZoom = zoom + (event.deltaY > 0 ? -0.08 : 0.08);
    setViewport(pan, nextZoom);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button === 1 || event.altKey || event.currentTarget === event.target) {
      selectNode(null);
      panStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!panStart.current) return;
    setViewport({ x: panStart.current.panX + event.clientX - panStart.current.x, y: panStart.current.panY + event.clientY - panStart.current.y }, zoom);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    panStart.current = null;
    clearConnection();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section
      className="blueprint-canvas"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        openSearch(toCanvasPoint(event.clientX, event.clientY, rect));
      }}
    >
      <div className="blueprint-canvas__world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg className="blueprint-edges" width="6000" height="4000" viewBox="-1200 -900 6000 4000">
          {graph.edges.map((edge) => (
            <BlueprintEdge key={edge.id} edge={edge} graph={graph} selected={selectedEdgeIds.includes(edge.id)} debugActive={activeNodeIds.has(edge.fromNodeId) && activeNodeIds.has(edge.toNodeId)} />
          ))}
        </svg>
        {graph.nodes.map((node) => (
          <BlueprintNode key={node.id} node={node} selected={selectedNodeIds.includes(node.id)} debugActive={activeNodeIds.has(node.id)} />
        ))}
      </div>
      <NodeSearchMenu />
      <BlueprintMinimap graph={graph} />
      <div className="blueprint-canvas__hint">Right-click or Space to add nodes • Alt-drag canvas to pan • Wheel to zoom</div>
    </section>
  );
}
