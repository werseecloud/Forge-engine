import { create } from "zustand";
import type { AssetMetadata } from "../types/asset";
import type { SceneObject } from "../types/scene";

export type ContentTab = "Content Browser" | "Blueprints" | "Output Log" | "Console" | "Animation Timeline";

interface AppState {
  appReady: boolean;
  activePanel: string;
  activeContentTab: ContentTab;
  activeContentFilter: string;
  selectedEntity: SceneObject | null;
  selectedAsset: AssetMetadata | null;
  setAppReady: (appReady: boolean) => void;
  setActivePanel: (activePanel: string) => void;
  setActiveContentTab: (activeContentTab: ContentTab) => void;
  setActiveContentFilter: (activeContentFilter: string) => void;
  selectEntity: (selectedEntity: SceneObject | null) => void;
  selectAsset: (selectedAsset: AssetMetadata | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appReady: false,
  activePanel: "editor",
  activeContentTab: "Content Browser",
  activeContentFilter: "All",
  selectedEntity: null,
  selectedAsset: null,
  setAppReady: (appReady) => set({ appReady }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setActiveContentTab: (activeContentTab) => set({ activeContentTab }),
  setActiveContentFilter: (activeContentFilter) => set({ activeContentFilter }),
  selectEntity: (selectedEntity) => set({ selectedEntity, selectedAsset: null }),
  selectAsset: (selectedAsset) => set({ selectedAsset, selectedEntity: null })
}));

