import { create } from "zustand";

export type ViewportTool = "select" | "move" | "rotate";

interface ViewportToolState {
  activeTool: ViewportTool;
  setActiveTool: (activeTool: ViewportTool) => void;
}

export const useViewportToolStore = create<ViewportToolState>((set) => ({
  activeTool: "select",
  setActiveTool: (activeTool) => set({ activeTool })
}));
