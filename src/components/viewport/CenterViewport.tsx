import { Box, FolderOpen, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { EmptyState } from "../shared/EmptyState";
import { PillButton } from "../shared/PillButton";
import { ViewportOverlay } from "./ViewportOverlay";
import { ViewportToolbar } from "./ViewportToolbar";

interface CenterViewportProps {
  fps: number;
  setFps: Dispatch<SetStateAction<number>>;
  onCreateProject: () => void;
  onOpenProject: () => void;
  onCreateLevel: () => void;
  onError: (message: string) => void;
}

export function CenterViewport({ fps, setFps, onCreateProject, onOpenProject, onCreateLevel, onError }: CenterViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const selectEntity = useAppStore((state) => state.selectEntity);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let count = 0;
    let lastFps = performance.now();
    const canvasElement = canvasRef.current;
    const context = canvasElement?.getContext("2d");
    if (!canvasElement || !context) return;
    const canvas = canvasElement;
    const ctx = context;

    function draw(now: number) {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#05070A";
      ctx.fillRect(0, 0, width, height);

      const grid = 42;
      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.lineWidth = 1;
      for (let x = (offset.x % grid) - grid; x < width + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = (offset.y % grid) - grid; y < height + grid; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(41,151,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(width / 2 - 80 + offset.x * 0.12, height / 2);
      ctx.lineTo(width / 2 + 80 + offset.x * 0.12, height / 2);
      ctx.moveTo(width / 2 + offset.x * 0.12, height / 2 - 80);
      ctx.lineTo(width / 2 + offset.x * 0.12, height / 2 + 80);
      ctx.stroke();

      if (activeLevel && activeLevel.objects.length > 0) {
        activeLevel.objects.forEach((object, index) => {
          const x = width / 2 + Math.cos(index * 1.7) * 90 + offset.x * 0.12;
          const y = height / 2 + Math.sin(index * 1.7) * 58 + offset.y * 0.12;
          ctx.fillStyle = object.visible ? "#2997FF" : "rgba(255,255,255,0.24)";
          ctx.fillRect(x - 8, y - 8, 16, 16);
          ctx.fillStyle = "rgba(245,247,250,0.82)";
          ctx.font = "12px Inter, system-ui";
          ctx.fillText(object.name, x + 13, y + 4);
        });
      }

      count += 1;
      if (now - lastFps >= 1000) {
        setFps(Math.round((count * 1000) / (now - lastFps)));
        count = 0;
        lastFps = now;
      }
      last = now;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [activeLevel, offset, setFps]);

  async function dropAsset(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const assetReference = event.dataTransfer.getData("application/x-forge-asset") || event.dataTransfer.getData("text/plain");
    if (!assetReference) return;
    if (!currentProject || !activeLevel) {
      onError("Open a project and level before dropping assets into the viewport.");
      return;
    }
    try {
      const name = assetReference.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "Scene Object";
      const level = await commands.addSceneObject(currentProject.rootPath, activeLevel.path, name, assetReference);
      const created = level.objects[level.objects.length - 1];
      setActiveLevel(level);
      setSelectedSceneObject(created);
      selectEntity(created);
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <section className="viewport-panel" onDragOver={(event) => event.preventDefault()} onDrop={dropAsset}>
      <ViewportToolbar />
      <canvas
        ref={canvasRef}
        className="viewport-canvas"
        onMouseDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseMove={(event) => {
          if (!dragRef.current) return;
          setOffset({
            x: dragRef.current.ox + event.clientX - dragRef.current.x,
            y: dragRef.current.oy + event.clientY - dragRef.current.y
          });
        }}
        onMouseUp={() => {
          dragRef.current = null;
        }}
        onMouseLeave={() => {
          dragRef.current = null;
        }}
      />
      <ViewportOverlay fps={fps} />

      {!currentProject ? (
        <div className="viewport-empty">
          <EmptyState
            title="No project open"
            detail="Create or open a Forge project to start editing real project files."
            actions={
              <>
                <PillButton active onClick={onCreateProject} icon={<Plus size={15} />}>Create Project</PillButton>
                <PillButton onClick={onOpenProject} icon={<FolderOpen size={15} />}>Open Project</PillButton>
              </>
            }
          />
        </div>
      ) : !activeLevel ? (
        <div className="viewport-empty">
          <EmptyState
            title="No level loaded"
            detail="Create a level to start placing imported assets."
            actions={<PillButton active onClick={onCreateLevel} icon={<Box size={15} />}>Create Level</PillButton>}
          />
        </div>
      ) : null}
    </section>
  );
}
