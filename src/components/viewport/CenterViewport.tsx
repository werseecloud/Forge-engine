import { Box, FolderOpen, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import * as THREE from "three";
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const selectEntity = useAppStore((state) => state.selectEntity);
  const [orbit, setOrbit] = useState({ yaw: -0.72, pitch: 0.48, distance: 26 });
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x081018, 0.028);

    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = "viewport-canvas";
    mountElement.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbfdcff, 0x172011, 1.25);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffd7a0, 4.2);
    sun.position.set(-18, 24, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const terrain = createTerrain();
    scene.add(terrain);
    scene.add(createWater());
    scene.add(createTower());
    scene.add(createEnvironmentDetails());

    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    let frame = 0;
    let frameCount = 0;
    let fpsStarted = performance.now();

    function resize() {
      const rect = mountElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }

    function updateCamera() {
      const target = new THREE.Vector3(0, 3, 0);
      const x = Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
      const y = Math.sin(orbit.pitch) * orbit.distance + 5;
      const z = Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
      camera.position.set(x, y, z);
      camera.lookAt(target);
    }

    function syncSceneObjects() {
      objectGroup.clear();
      activeLevel?.objects.forEach((object, index) => {
        const layer = activeLevel.layers.find((item) => item.id === object.layer);
        if (layer && !layer.visible) return;
        const marker = createSceneObjectMarker(object);
        const angle = index * 1.83;
        const transform = object.transform;
        marker.position.set(
          transform?.position.x ?? Math.cos(angle) * 5.5,
          transform?.position.y ?? 1.2,
          transform?.position.z ?? Math.sin(angle) * 4.2
        );
        marker.rotation.set(transform?.rotation.x ?? 0, transform?.rotation.y ?? 0, transform?.rotation.z ?? 0);
        marker.scale.set(transform?.scale.x ?? 1, transform?.scale.y ?? 1, transform?.scale.z ?? 1);
        objectGroup.add(marker);
      });
    }

    function animate(now: number) {
      resize();
      updateCamera();
      syncSceneObjects();
      renderer.render(scene, camera);
      frameCount += 1;
      if (now - fpsStarted >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsStarted)));
        frameCount = 0;
        fpsStarted = now;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      mountElement.removeChild(renderer.domElement);
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
    };
  }, [activeLevel?.layers, activeLevel?.objects, orbit, setFps]);

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
      <div
        ref={mountRef}
        className="viewport-three"
        onMouseDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, yaw: orbit.yaw, pitch: orbit.pitch };
        }}
        onMouseMove={(event) => {
          if (!dragRef.current) return;
          setOrbit({
            ...orbit,
            yaw: dragRef.current.yaw - (event.clientX - dragRef.current.x) * 0.006,
            pitch: Math.max(0.14, Math.min(1.05, dragRef.current.pitch + (event.clientY - dragRef.current.y) * 0.004))
          });
        }}
        onMouseUp={() => {
          dragRef.current = null;
        }}
        onMouseLeave={() => {
          dragRef.current = null;
        }}
        onWheel={(event) => {
          setOrbit({ ...orbit, distance: Math.max(12, Math.min(48, orbit.distance + event.deltaY * 0.025)) });
        }}
      />
      <ViewportOverlay fps={fps} />

      {!currentProject ? (
        <div className="viewport-empty">
          <EmptyState
            title="No project open"
            detail="Create or open a Forge project to edit a local 3D environment."
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
            detail="Create a level to start placing imported assets in the 3D environment."
            actions={<PillButton active onClick={onCreateLevel} icon={<Box size={15} />}>Create Level</PillButton>}
          />
        </div>
      ) : null}
    </section>
  );
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(64, 64, 128, 128);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const river = Math.exp(-Math.abs(x + Math.sin(z * 0.18) * 2.5) * 0.55);
    const hills = Math.sin(x * 0.22) * 1.6 + Math.cos(z * 0.18) * 1.4 + Math.sin((x + z) * 0.12) * 1.1;
    position.setY(index, hills - river * 4.2);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0x263224, roughness: 0.88, metalness: 0.02 });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  return terrain;
}

function createWater() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 62, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0f5fa8,
      emissive: 0x021323,
      transparent: true,
      opacity: 0.64,
      roughness: 0.08,
      metalness: 0.15
    })
  );
  water.rotateX(-Math.PI / 2);
  water.position.set(0, -1.35, 0);
  return water;
}

function createTower() {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x50555a, roughness: 0.72, metalness: 0.08 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x1e7bff, emissive: 0x0b4bd7, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.9, 1.4, 8), stone);
  base.position.y = 0.25;
  base.castShadow = true;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9, 2.6), stone);
  body.position.y = 5.3;
  body.castShadow = true;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 1.2, 6), stone);
  crown.position.y = 10.4;
  crown.castShadow = true;
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 12), glow);
  beacon.position.y = 11.4;
  group.add(base, body, crown, beacon);
  group.position.set(7, 0.4, -2.5);
  return group;
}

function createEnvironmentDetails() {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x34383a, roughness: 0.9 });
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x1f3a24, roughness: 0.85 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 0.8 });
  for (let i = 0; i < 36; i += 1) {
    const angle = i * 2.17;
    const radius = 9 + (i % 7) * 2.7;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (i % 4) * 0.16), rockMat);
    rock.position.set(Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius);
    rock.castShadow = true;
    group.add(rock);
  }
  for (let i = 0; i < 22; i += 1) {
    const angle = i * 1.71;
    const radius = 8 + (i % 5) * 3.4;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.25, 7), trunkMat);
    trunk.position.y = 0.75;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.2, 8), treeMat);
    crown.position.y = 2.2;
    tree.add(trunk, crown);
    tree.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    group.add(tree);
  }
  return group;
}

function createSceneObjectMarker(object: import("../../types/scene").SceneObject) {
  const componentTypes = object.components.map((component) => component.componentType.toLowerCase());
  const primitive = String(object.components.find((component) => component.componentType === "StaticMesh")?.data.primitive ?? object.assetReference ?? "");
  const disabled = !object.visible;
  const material = new THREE.MeshStandardMaterial({
    color: disabled ? 0x6b7280 : componentTypes.some((type) => type.includes("light")) ? 0xffd60a : componentTypes.includes("playerstart") ? 0x30d158 : 0x2997ff,
    emissive: disabled ? 0x000000 : componentTypes.some((type) => type.includes("light")) ? 0x332400 : 0x062a66,
    roughness: 0.45,
    metalness: 0.2
  });

  if (componentTypes.includes("camera")) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.55), material));
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.35, 16), material);
    lens.rotateX(Math.PI / 2);
    lens.position.z = -0.42;
    group.add(lens);
    return group;
  }
  if (componentTypes.some((type) => type.includes("light"))) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 16), material));
    const glow = new THREE.PointLight(0xffd60a, 1.8, 8);
    group.add(glow);
    return group;
  }
  if (componentTypes.includes("playerstart")) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 6, 12), material));
    return group;
  }
  if (primitive.includes("sphere")) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 28, 18), material);
    mesh.castShadow = true;
    return mesh;
  }
  if (primitive.includes("plane")) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), material);
    mesh.rotateX(-Math.PI / 2);
    mesh.receiveShadow = true;
    return mesh;
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), material);
  mesh.castShadow = true;
  return mesh;
}
