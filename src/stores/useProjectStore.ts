import { create } from "zustand";
import type { ProjectManifest, ProjectSummary } from "../types/project";

interface ProjectState {
  currentProject: ProjectManifest | null;
  recentProjects: ProjectSummary[];
  pinnedProjects: string[];
  projectSettings: Record<string, unknown> | null;
  setCurrentProject: (currentProject: ProjectManifest | null) => void;
  setRecentProjects: (recentProjects: ProjectSummary[]) => void;
  setPinnedProjects: (pinnedProjects: string[]) => void;
  setProjectSettings: (projectSettings: Record<string, unknown> | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  recentProjects: [],
  pinnedProjects: [],
  projectSettings: null,
  setCurrentProject: (currentProject) => set({ currentProject }),
  setRecentProjects: (recentProjects) => set({ recentProjects }),
  setPinnedProjects: (pinnedProjects) => set({ pinnedProjects }),
  setProjectSettings: (projectSettings) => set({ projectSettings })
}));

