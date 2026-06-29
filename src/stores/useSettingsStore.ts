import { create } from "zustand";
import type { AppSettings } from "../types/settings";

interface SettingsState {
  settings: AppSettings | null;
  defaultProjectsDir: string;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setSettings: (settings: AppSettings | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  defaultProjectsDir: "",
  updateSetting: (key, value) =>
    set((state) => {
      if (!state.settings) return state;
      const next = { ...state.settings, [key]: value };
      return {
        settings: next,
        defaultProjectsDir: key === "defaultProjectsDir" ? String(value) : state.defaultProjectsDir
      };
    }),
  setSettings: (settings) =>
    set({
      settings,
      defaultProjectsDir: settings?.defaultProjectsDir ?? ""
    })
}));

