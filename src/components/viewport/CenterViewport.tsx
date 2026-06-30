import { Box, FolderOpen, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { chooseSkyboxAsset, loadSkyboxManifest, normalizeSkyboxSettings, type SkyboxManifest } from "../../lib/skybox";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { useViewportToolStore, type ViewportTool } from "../../stores/useViewportToolStore";
import { EmptyState } from "../shared/EmptyState";
import { PillButton } from "../shared/PillButton";
import { ViewportOverlay } from "./ViewportOverlay";
import { ViewportToolbar, type ShadingMode, type ViewPreset } from "./ViewportToolbar";

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
  const selectedSceneObject = useSceneStore((state) => state.selectedSceneObject);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const selectEntity = useAppStore((state) => state.selectEntity);
  const activeTool = useViewportToolStore((state) => state.activeTool);
  const [viewPreset, setViewPreset] = useState<ViewPreset>("Perspective");
  const [shadingMode, setShadingMode] = useState<ShadingMode>("Lit");
  const [showEnvironment, setShowEnvironment] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const currentProjectRef = useRef(currentProject);
  const activeLevelRef = useRef(activeLevel);
  const selectedSceneObjectRef = useRef(selectedSceneObject);
  const activeToolRef = useRef<ViewportTool>(activeTool);
  const viewportOptionsRef = useRef({ shadingMode, showEnvironment, gridVisible });
  const orbitRef = useRef({ yaw: -0.72, pitch: 0.48, distance: 26 });
  const commitTransformRef = useRef<(objectId: string, object3d: THREE.Object3D) => void>(() => {});

  useEffect(() => {
    currentProjectRef.current = currentProject;
    activeLevelRef.current = activeLevel;
    selectedSceneObjectRef.current = selectedSceneObject;
    activeToolRef.current = activeTool;
    viewportOptionsRef.current = { shadingMode, showEnvironment, gridVisible };
  }, [activeLevel, activeTool, currentProject, gridVisible, selectedSceneObject, shadingMode, showEnvironment]);

  const changeViewPreset = useCallback((nextPreset: ViewPreset) => {
    setViewPreset(nextPreset);
    if (nextPreset === "Top") orbitRef.current = { yaw: 0, pitch: 1.05, distance: 30 };
    if (nextPreset === "Front") orbitRef.current = { yaw: Math.PI, pitch: 0.28, distance: 26 };
    if (nextPreset === "Right") orbitRef.current = { yaw: -Math.PI / 2, pitch: 0.28, distance: 26 };
    if (nextPreset === "Perspective") orbitRef.current = { yaw: -0.72, pitch: 0.48, distance: 26 };
  }, []);

  const commitObjectTransform = useCallback(async (objectId: string, object3d: THREE.Object3D) => {
    const project = currentProjectRef.current;
    const level = activeLevelRef.current;
    const existing = level?.objects.find((object) => object.id === objectId);
    if (!project || !level || !existing) return;

    const updated = {
      ...existing,
      transform: {
        position: roundVec3(object3d.position),
        rotation: roundVec3(object3d.rotation),
        scale: clampScale(roundVec3(object3d.scale))
      }
    };
    const optimistic = {
      ...level,
      objects: level.objects.map((object) => object.id === objectId ? updated : object)
    };
    activeLevelRef.current = optimistic;
    selectedSceneObjectRef.current = updated;
    setActiveLevel(optimistic);
    setSelectedSceneObject(updated);
    selectEntity(updated);

    try {
      const saved = await commands.updateSceneObject(project.rootPath, level.path, updated);
      const savedObject = saved.objects.find((object) => object.id === objectId) ?? updated;
      activeLevelRef.current = saved;
      selectedSceneObjectRef.current = savedObject;
      setActiveLevel(saved);
      setSelectedSceneObject(savedObject);
      selectEntity(savedObject);
    } catch (error) {
      onError(String(error));
    }
  }, [onError, selectEntity, setActiveLevel, setSelectedSceneObject]);

  useEffect(() => {
    commitTransformRef.current = commitObjectTransform;
  }, [commitObjectTransform]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09121d);

    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = "viewport-canvas";
    mountElement.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbfdcff, 0x253040, 1.05);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-12, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    const unlitFill = new THREE.AmbientLight(0xffffff, 1.65);
    unlitFill.visible = false;
    scene.add(unlitFill);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const rgbeLoader = new RGBELoader();
    let skyboxManifest: SkyboxManifest | null = null;
    let activeSkyboxKey = "";
    let activeSkyboxTexture: THREE.Texture | null = null;
    void loadSkyboxManifest().then((manifest) => {
      skyboxManifest = manifest;
    }).catch((error) => onError(String(error)));

    const grid = new THREE.GridHelper(128, 128, 0xd7d1c5, 0x8f8a80);
    grid.position.y = 0;
    grid.material.transparent = true;
    grid.material.opacity = 0.58;
    scene.add(grid);
    const gridPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(128, 128),
      new THREE.MeshStandardMaterial({
        color: 0xbcb5a8,
        roughness: 0.82,
        metalness: 0,
        transparent: true,
        opacity: 0.72
      })
    );
    gridPlane.rotateX(-Math.PI / 2);
    gridPlane.receiveShadow = true;
    scene.add(gridPlane);

    const objectGroup = new THREE.Group();
    scene.add(objectGroup);
    const objectMap = new Map<string, THREE.Object3D>();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.82);
    transformControls.setSpace("world");
    transformControls.setTranslationSnap(0.25);
    transformControls.setRotationSnap(THREE.MathUtils.degToRad(5));
    transformControls.setScaleSnap(0.1);
    const transformHelper = transformControls.getHelper();
    transformHelper.visible = false;
    scene.add(transformHelper);
    const selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0x2997ff);
    selectionBox.visible = false;
    scene.add(selectionBox);

    let frame = 0;
    let frameCount = 0;
    let fpsStarted = performance.now();
    let transformDragging = false;
    let orbitDrag: { pointerId: number; x: number; y: number; yaw: number; pitch: number } | null = null;
    let pendingPick: { x: number; y: number; objectId: string | null } | null = null;

    function resize() {
      const rect = mountElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }

    function updateCamera() {
      const target = new THREE.Vector3(0, 3, 0);
      const orbit = orbitRef.current;
      const x = Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
      const y = Math.sin(orbit.pitch) * orbit.distance + 5;
      const z = Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
      camera.position.set(x, y, z);
      camera.lookAt(target);
    }

    function syncSceneObjects() {
      const options = viewportOptionsRef.current;
      const lit = options.shadingMode === "Lit";
      hemi.visible = lit;
      sun.visible = lit;
      unlitFill.visible = !lit;
      grid.visible = options.gridVisible;
      gridPlane.visible = options.gridVisible;

      const level = activeLevelRef.current;
      const selected = selectedSceneObjectRef.current;
      const visibleIds = new Set<string>();
      syncSkybox(level, options.showEnvironment);

      if (!level) {
        objectMap.forEach((object) => {
          objectGroup.remove(object);
          disposeObject(object);
        });
        objectMap.clear();
        transformControls.detach();
        transformHelper.visible = false;
        selectionBox.visible = false;
        return;
      }

      level.objects.forEach((object, index) => {
        if (isSkyboxObject(object)) return;
        const layer = level.layers.find((item) => item.id === object.layer);
        if (layer && !layer.visible) return;
        visibleIds.add(object.id);
        let marker = objectMap.get(object.id);
        if (!marker) {
          marker = createSceneObjectMarker(object);
          marker.userData.sceneObjectId = object.id;
          objectMap.set(object.id, marker);
          objectGroup.add(marker);
        }
        if (!(transformDragging && selected?.id === object.id)) {
          applyObjectTransform(marker, object, index);
        }
      });

      objectMap.forEach((object, objectId) => {
        if (!visibleIds.has(objectId)) {
          objectGroup.remove(object);
          objectMap.delete(objectId);
          disposeObject(object);
        }
      });

      const selectedMarker = selected ? objectMap.get(selected.id) : null;
      const tool = activeToolRef.current;
      if (selectedMarker && tool !== "select") {
        const mode = tool === "move" ? "translate" : tool;
        transformControls.setMode(mode);
        transformControls.attach(selectedMarker);
        transformHelper.visible = true;
      } else {
        transformControls.detach();
        transformHelper.visible = false;
      }

      if (selectedMarker) {
        selectionBox.setFromObject(selectedMarker);
        selectionBox.visible = true;
      } else {
        selectionBox.visible = false;
      }
    }

    function syncSkybox(level: import("../../types/scene").SceneLevel | null, showEnvironment: boolean) {
      const skyboxObject = level?.objects.find(isSkyboxObject);
      const component = skyboxObject?.components.find((item) => item.componentType === "Skybox");
      const settings = normalizeSkyboxSettings(component?.data);
      const asset = skyboxManifest && chooseSkyboxAsset(skyboxManifest, settings);
      const enabled = Boolean(showEnvironment && skyboxObject?.visible && settings.enabled && asset);
      if (!enabled || !asset) {
        scene.environment = null;
        scene.background = new THREE.Color(0x09121d);
        activeSkyboxKey = "";
        return;
      }
      const key = `${asset.path}:${settings.intensity}:${settings.blur}:${settings.showAsBackground}`;
      renderer.toneMappingExposure = Math.max(0.1, settings.intensity);
      scene.backgroundBlurriness = settings.blur;
      scene.backgroundRotation.set(0, THREE.MathUtils.degToRad(settings.rotation), 0);
      scene.environmentRotation.set(0, THREE.MathUtils.degToRad(settings.rotation), 0);
      if (key === activeSkyboxKey) return;
      activeSkyboxKey = key;
      rgbeLoader.load(
        asset.path,
        (texture) => {
          if (activeSkyboxTexture) activeSkyboxTexture.dispose();
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          texture.dispose();
          activeSkyboxTexture = envMap;
          scene.environment = envMap;
          scene.background = settings.showAsBackground ? envMap : new THREE.Color(0x09121d);
        },
        undefined,
        (error) => onError(`Skybox load failed: ${String(error)}`)
      );
    }

    function setPointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    }

    function pickedObjectId(event: PointerEvent) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(Array.from(objectMap.values()), true);
      for (const hit of hits) {
        let node: THREE.Object3D | null = hit.object;
        while (node && node.parent !== objectGroup) node = node.parent;
        const objectId = node?.userData.sceneObjectId;
        if (typeof objectId === "string") return objectId;
      }
      return null;
    }

    function selectObject(objectId: string | null) {
      if (!objectId) {
        setSelectedSceneObject(null);
        selectEntity(null);
        return;
      }
      const object = activeLevelRef.current?.objects.find((item) => item.id === objectId) ?? null;
      setSelectedSceneObject(object);
      selectEntity(object);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button === 2 || event.altKey) {
        orbitDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, ...orbitRef.current };
        renderer.domElement.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }

      const objectId = pickedObjectId(event);
      if (activeToolRef.current !== "select" && !objectId) return;
      pendingPick = { x: event.clientX, y: event.clientY, objectId };
      if (!objectId && activeToolRef.current === "select") {
        orbitDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, ...orbitRef.current };
        renderer.domElement.setPointerCapture(event.pointerId);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (!orbitDrag || orbitDrag.pointerId !== event.pointerId || transformDragging) return;
      const nextPitch = orbitDrag.pitch + (event.clientY - orbitDrag.y) * 0.004;
      setViewPreset("Perspective");
      orbitRef.current = {
        ...orbitRef.current,
        yaw: orbitDrag.yaw - (event.clientX - orbitDrag.x) * 0.006,
        pitch: Math.max(0.14, Math.min(1.05, nextPitch))
      };
    }

    function handlePointerUp(event: PointerEvent) {
      if (orbitDrag?.pointerId === event.pointerId) {
        renderer.domElement.releasePointerCapture(event.pointerId);
        orbitDrag = null;
      }
      if (pendingPick && !transformDragging) {
        const distance = Math.hypot(event.clientX - pendingPick.x, event.clientY - pendingPick.y);
        if (distance < 4) selectObject(pendingPick.objectId);
      }
      pendingPick = null;
    }

    function handleWheel(event: WheelEvent) {
      orbitRef.current = {
        ...orbitRef.current,
        distance: Math.max(12, Math.min(48, orbitRef.current.distance + event.deltaY * 0.025))
      };
    }

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function handleTransformDrag(event: { value: unknown }) {
      const dragging = Boolean(event.value);
      transformDragging = dragging;
      if (!dragging && selectedSceneObjectRef.current && transformControls.object) {
        commitTransformRef.current(selectedSceneObjectRef.current.id, transformControls.object);
      }
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

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: true });
    renderer.domElement.addEventListener("contextmenu", handleContextMenu);
    transformControls.addEventListener("dragging-changed", handleTransformDrag);

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("contextmenu", handleContextMenu);
      transformControls.removeEventListener("dragging-changed", handleTransformDrag);
      transformControls.dispose();
      activeSkyboxTexture?.dispose();
      pmremGenerator.dispose();
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
  }, [selectEntity, setFps, setSelectedSceneObject]);

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
      <ViewportToolbar
        viewPreset={viewPreset}
        shadingMode={shadingMode}
        showEnvironment={showEnvironment}
        gridVisible={gridVisible}
        onViewPresetChange={changeViewPreset}
        onShadingModeChange={setShadingMode}
        onShowEnvironmentChange={setShowEnvironment}
        onGridVisibleChange={setGridVisible}
      />
      <div
        ref={mountRef}
        className="viewport-three"
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

function applyObjectTransform(marker: THREE.Object3D, object: import("../../types/scene").SceneObject, index: number) {
  const angle = index * 1.83;
  const transform = object.transform;
  marker.position.set(
    transform?.position.x ?? Math.cos(angle) * 5.5,
    transform?.position.y ?? 1.2,
    transform?.position.z ?? Math.sin(angle) * 4.2
  );
  marker.rotation.set(transform?.rotation.x ?? 0, transform?.rotation.y ?? 0, transform?.rotation.z ?? 0);
  marker.scale.set(
    Math.max(0.05, transform?.scale.x ?? 1),
    Math.max(0.05, transform?.scale.y ?? 1),
    Math.max(0.05, transform?.scale.z ?? 1)
  );
}

function roundVec3(vec: THREE.Vector3 | THREE.Euler) {
  return {
    x: Number(vec.x.toFixed(3)),
    y: Number(vec.y.toFixed(3)),
    z: Number(vec.z.toFixed(3))
  };
}

function clampScale(vec: { x: number; y: number; z: number }) {
  return {
    x: Math.max(0.05, vec.x),
    y: Math.max(0.05, vec.y),
    z: Math.max(0.05, vec.z)
  };
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material?.dispose?.();
  });
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

function isSkyboxObject(object: import("../../types/scene").SceneObject) {
  return object.components.some((component) => component.componentType === "Skybox");
}
