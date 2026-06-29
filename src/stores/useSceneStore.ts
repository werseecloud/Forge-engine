import { create } from "zustand";
import type { LevelSummary, SceneLevel, SceneObject, WorldLayer } from "../types/scene";

interface SceneState {
  levels: LevelSummary[];
  activeLevel: SceneLevel | null;
  sceneObjects: SceneObject[];
  worldLayers: WorldLayer[];
  selectedSceneObject: SceneObject | null;
  setLevels: (levels: LevelSummary[]) => void;
  setActiveLevel: (activeLevel: SceneLevel | null) => void;
  setSelectedSceneObject: (selectedSceneObject: SceneObject | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  levels: [],
  activeLevel: null,
  sceneObjects: [],
  worldLayers: [],
  selectedSceneObject: null,
  setLevels: (levels) => set({ levels }),
  setActiveLevel: (activeLevel) =>
    set({
      activeLevel,
      sceneObjects: activeLevel?.objects ?? [],
      worldLayers: activeLevel?.layers ?? []
    }),
  setSelectedSceneObject: (selectedSceneObject) => set({ selectedSceneObject })
}));

