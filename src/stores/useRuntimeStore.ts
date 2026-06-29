import { create } from "zustand";

export type PreviewMode = "Game" | "Simulation" | "Cinematic" | "VR Preview" | "Network Preview" | "Standalone Window";

interface RuntimeState {
  previewMode: PreviewMode;
  runtimePaused: boolean;
  tick: number;
  startedAt: string | null;
  setPreviewMode: (previewMode: PreviewMode) => void;
  startRuntime: () => void;
  stopRuntime: () => void;
  setPaused: (runtimePaused: boolean) => void;
  stepFrame: () => void;
}

export const previewModes: PreviewMode[] = ["Game", "Simulation", "Cinematic", "VR Preview", "Network Preview", "Standalone Window"];

export const useRuntimeStore = create<RuntimeState>((set) => ({
  previewMode: "Game",
  runtimePaused: false,
  tick: 0,
  startedAt: null,
  setPreviewMode: (previewMode) => set({ previewMode }),
  startRuntime: () => set({ runtimePaused: false, tick: 0, startedAt: new Date().toISOString() }),
  stopRuntime: () => set({ runtimePaused: false, tick: 0, startedAt: null }),
  setPaused: (runtimePaused) => set({ runtimePaused }),
  stepFrame: () => set((state) => ({ tick: state.tick + 1 }))
}));
