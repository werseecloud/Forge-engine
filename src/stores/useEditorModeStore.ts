import { create } from "zustand";

export type EditorMode = "EditMode" | "PlayMode";

interface EditorModeState {
  mode: EditorMode;
  error: string | null;
  warning: string | null;
  enterPlayMode: () => void;
  returnToEditMode: () => void;
  setError: (error: string | null) => void;
  setWarning: (warning: string | null) => void;
}

export const useEditorModeStore = create<EditorModeState>((set) => ({
  mode: "EditMode",
  error: null,
  warning: null,
  enterPlayMode: () => set({ mode: "PlayMode", error: null }),
  returnToEditMode: () => set({ mode: "EditMode", error: null, warning: null }),
  setError: (error) => set({ error }),
  setWarning: (warning) => set({ warning })
}));
