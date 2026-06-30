import type { ProjectSummary } from "./project";
import type { GraphicsSettings } from "./renderer";

export interface AppSettings {
  defaultProjectsDir: string;
  recentProjects: ProjectSummary[];
  pinnedProjects: string[];
  theme: string;
  uiScale: number;
  lastOpenedProject: string | null;
  lastOpenedLevel: string | null;
  contentBrowserViewMode: string;
  editorLayout: Record<string, unknown>;
  autosaveEnabled: boolean;
  autosaveInterval: number;
  graphicsSettings: GraphicsSettings;
}
