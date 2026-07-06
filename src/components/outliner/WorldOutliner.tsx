import { Box, Camera, Cuboid, Eye, EyeOff, Globe2, Lightbulb, Layers3, Mountain, Plus, Search, SlidersHorizontal, Sun, Trash2, UserRoundCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { SceneComponent, SceneObject } from "../../types/scene";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";
import { PillButton } from "../shared/PillButton";

interface WorldOutlinerProps {
  onCreateLevel: () => void;
  onCreateWorld: () => void;
}

export function WorldOutliner({ onCreateLevel, onCreateWorld }: WorldOutlinerProps) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const selectEntity = useAppStore((state) => state.selectEntity);

  const objects = useMemo(() => {
    const all = activeLevel?.objects ?? [];
    if (!query.trim()) return all;
    return all.filter((object) => object.name.toLowerCase().includes(query.toLowerCase()));
  }, [activeLevel?.objects, query]);

  async function persistObject(object: SceneObject) {
    if (!currentProject || !activeLevel) return;
    const saved = await commands.saveLevel(currentProject.rootPath, {
      ...activeLevel,
      objects: [...activeLevel.objects, object]
    });
    setActiveLevel(saved);
    setSelectedSceneObject(object);
    selectEntity(object);
    setAddOpen(false);
  }

  async function deleteObject(objectId: string) {
    if (!currentProject || !activeLevel) return;
    const saved = await commands.deleteSceneObject(currentProject.rootPath, activeLevel.path, objectId);
    setActiveLevel(saved);
    setSelectedSceneObject(null);
    selectEntity(null);
  }

  async function toggleVisible(object: SceneObject) {
    if (!currentProject || !activeLevel) return;
    const updated = { ...object, visible: !object.visible };
    const saved = await commands.updateSceneObject(currentProject.rootPath, activeLevel.path, updated);
    setActiveLevel(saved);
    setSelectedSceneObject(updated);
    selectEntity(updated);
  }

  function createObject(kind: ObjectKind) {
    const layer = activeLevel?.layers[0]?.id ?? null;
    const spec = objectSpecs[kind];
    const object: SceneObject = {
      id: `entity_${crypto.randomUUID().replace(/-/g, "")}`,
      name: `${spec.name} ${((activeLevel?.objects.length ?? 0) + 1).toString().padStart(2, "0")}`,
      tags: spec.tags,
      layer,
      visible: true,
      assetReference: spec.assetReference,
      transform: {
        position: { x: 0, y: spec.y, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      components: spec.components()
    };
    void persistObject(object);
  }

  if (!currentProject) {
    return <EmptyState title="No project open" detail="World data appears here after opening a Forge project." />;
  }

  if (!activeLevel) {
    return (
      <EmptyState
        title="No level loaded"
        detail="Create a level to start building your world."
        actions={<PillButton active onClick={onCreateLevel}>Create Level</PillButton>}
      />
    );
  }

  return (
    <div className="outliner">
      <div className="panel-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." />
        <IconButton label="Filter"><SlidersHorizontal size={15} /></IconButton>
        <div className="dropdown-anchor">
          <IconButton label="Add scene object" onClick={() => setAddOpen((open) => !open)}><Plus size={15} /></IconButton>
          {addOpen ? (
            <div className="object-add-menu">
              <button onClick={() => { setAddOpen(false); onCreateWorld(); }}>
                <Globe2 size={14} />
                <span>Add World</span>
              </button>
              {objectMenu.map((item) => (
                <button key={item.kind} onClick={() => createObject(item.kind)}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="tree-list">
        <div className="tree-row tree-row--level">
          <Layers3 size={15} />
          <span>{activeLevel.name}</span>
          <Eye size={14} />
        </div>
        {objects.length === 0 ? (
          <div className="inline-empty">No scene objects in this level.</div>
        ) : (
          objects.map((object) => isWorldObject(object) ? (
            <div key={object.id} className={selectedSceneObject?.id === object.id ? "world-tree is-selected" : "world-tree"}>
              <div
                role="button"
                tabIndex={0}
                className="tree-row tree-row--child"
                onClick={() => {
                  setSelectedSceneObject(object);
                  selectEntity(object);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedSceneObject(object);
                    selectEntity(object);
                  }
                }}
              >
                <Globe2 size={14} />
                <span>{object.name}</span>
                <button className="row-icon" aria-label={`Toggle ${object.name} visibility`} onClick={(event) => { event.stopPropagation(); void toggleVisible(object); }}>
                  {object.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button className="row-icon" aria-label={`Delete ${object.name}`} onClick={(event) => { event.stopPropagation(); void deleteObject(object.id); }}>
                  <Trash2 size={13} />
                </button>
              </div>
              {worldChildren.map((child) => (
                <div key={child.label} className="tree-row tree-row--grandchild">
                  {child.icon}
                  <span>{child.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              key={object.id}
              role="button"
              tabIndex={0}
              className={selectedSceneObject?.id === object.id ? "tree-row tree-row--child is-selected" : "tree-row tree-row--child"}
              onClick={() => {
                setSelectedSceneObject(object);
                selectEntity(object);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedSceneObject(object);
                  selectEntity(object);
                }
              }}
            >
              <Box size={14} />
              <span>{object.name}</span>
              <button className="row-icon" aria-label={`Toggle ${object.name} visibility`} onClick={(event) => { event.stopPropagation(); void toggleVisible(object); }}>
                {object.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button className="row-icon" aria-label={`Delete ${object.name}`} onClick={(event) => { event.stopPropagation(); void deleteObject(object.id); }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type ObjectKind = "cube" | "sphere" | "plane" | "camera" | "directionalLight" | "pointLight" | "spotLight" | "playerStart";

const objectMenu: { kind: ObjectKind; label: string; icon: ReactNode }[] = [
  { kind: "cube", label: "Cube", icon: <Cuboid size={14} /> },
  { kind: "sphere", label: "Sphere", icon: <Box size={14} /> },
  { kind: "plane", label: "Plane", icon: <Layers3 size={14} /> },
  { kind: "camera", label: "Camera", icon: <Camera size={14} /> },
  { kind: "directionalLight", label: "Directional Light", icon: <Sun size={14} /> },
  { kind: "pointLight", label: "Point Light", icon: <Lightbulb size={14} /> },
  { kind: "spotLight", label: "Spot Light", icon: <Lightbulb size={14} /> },
  { kind: "playerStart", label: "Player Start", icon: <UserRoundCheck size={14} /> }
];

const worldChildren: { label: string; icon: ReactNode }[] = [
  { label: "Terrain", icon: <Mountain size={13} /> },
  { label: "Rocks", icon: <Box size={13} /> },
  { label: "Grass", icon: <Layers3 size={13} /> },
  { label: "Foliage", icon: <Layers3 size={13} /> },
  { label: "Water", icon: <Layers3 size={13} /> },
  { label: "Lighting", icon: <Sun size={13} /> },
  { label: "Sky", icon: <Globe2 size={13} /> },
  { label: "World Settings", icon: <SlidersHorizontal size={13} /> }
];

const objectSpecs: Record<ObjectKind, { name: string; y: number; tags: string[]; assetReference: string | null; components: () => SceneComponent[] }> = {
  cube: { name: "Cube", y: 0.5, tags: ["primitive", "mesh"], assetReference: "primitive:cube", components: () => [{ componentType: "StaticMesh", data: { primitive: "cube" } }] },
  sphere: { name: "Sphere", y: 0.5, tags: ["primitive", "mesh"], assetReference: "primitive:sphere", components: () => [{ componentType: "StaticMesh", data: { primitive: "sphere" } }] },
  plane: { name: "Plane", y: 0, tags: ["primitive", "mesh"], assetReference: "primitive:plane", components: () => [{ componentType: "StaticMesh", data: { primitive: "plane" } }] },
  camera: { name: "Camera", y: 2, tags: ["camera"], assetReference: null, components: () => [{ componentType: "Camera", data: { fov: 60, near: 0.1, far: 1000 } }] },
  directionalLight: { name: "Directional Light", y: 4, tags: ["light"], assetReference: null, components: () => [{ componentType: "DirectionalLight", data: { intensity: 4, color: "#ffffff" } }] },
  pointLight: { name: "Point Light", y: 2, tags: ["light"], assetReference: null, components: () => [{ componentType: "PointLight", data: { intensity: 8, radius: 12, color: "#2997ff" } }] },
  spotLight: { name: "Spot Light", y: 3, tags: ["light"], assetReference: null, components: () => [{ componentType: "SpotLight", data: { intensity: 10, angle: 35, color: "#ffffff" } }] },
  playerStart: { name: "Player Start", y: 1, tags: ["player_start"], assetReference: null, components: () => [{ componentType: "PlayerStart", data: { enabled: true } }] }
};

function isWorldObject(object: SceneObject) {
  return object.components.some((component) => component.componentType === "WorldComponent");
}
