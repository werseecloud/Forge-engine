import { create } from "zustand";
import type { LevelSummary, SceneLevel, SceneObject, WorldLayer } from "../types/scene";

interface SceneState {
  levels: LevelSummary[];
  activeLevel: SceneLevel | null;
  sceneObjects: SceneObject[];
  worldLayers: WorldLayer[];
  selectedSceneObject: SceneObject | null;
  hasOpenScene: () => boolean;
  hasPlayerStart: () => boolean;
  setLevels: (levels: LevelSummary[]) => void;
  setActiveLevel: (activeLevel: SceneLevel | null) => void;
  setSelectedSceneObject: (selectedSceneObject: SceneObject | null) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  levels: [],
  activeLevel: null,
  sceneObjects: [],
  worldLayers: [],
  selectedSceneObject: null,
  hasOpenScene: () => Boolean(get().activeLevel),
  hasPlayerStart: () => {
    const objects = get().activeLevel?.objects ?? [];
    return objects.some((object) => {
      const text = `${object.id} ${object.name} ${object.tags.join(" ")}`.toLowerCase();
      if (text.includes("player_start") || text.includes("player start") || text.includes("playerstart")) return true;
      return object.components.some((component) => component.componentType.toLowerCase().includes("playerstart"));
    });
  },
  setLevels: (levels) => set({ levels }),
  setActiveLevel: (activeLevel) =>
    set({
      activeLevel,
      sceneObjects: activeLevel?.objects ?? [],
      worldLayers: activeLevel?.layers ?? []
    }),
  setSelectedSceneObject: (selectedSceneObject) => set({ selectedSceneObject })
}));
