import { create } from "zustand";
import type { CheckResult, ExistingInstall, HealthCheckResult, InstallConfig, InstallerComponent, InstallPlan, InstallResult, UserPaths } from "../types/installer";

interface InstallerStore {
  step: number;
  userPaths: UserPaths | null;
  installMode: string;
  installPath: string;
  projectFolder: string;
  existingInstall: ExistingInstall | null;
  systemChecks: CheckResult[];
  components: InstallerComponent[];
  plan: InstallPlan | null;
  installingSteps: Record<string, "pending" | "running" | "done" | "failed">;
  progressText: string;
  result: InstallResult | null;
  healthChecks: HealthCheckResult[];
  errors: string[];
  logs: string[];
  set: (patch: Partial<InstallerStore>) => void;
  config: () => InstallConfig;
}

export const useInstallerStore = create<InstallerStore>((set, get) => ({
  step: 0,
  userPaths: null,
  installMode: "recommended",
  installPath: "",
  projectFolder: "",
  existingInstall: null,
  systemChecks: [],
  components: [],
  plan: null,
  installingSteps: {},
  progressText: "",
  result: null,
  healthChecks: [],
  errors: [],
  logs: [],
  set: (patch) => set(patch),
  config: () => ({
    installMode: get().installMode,
    installPath: get().installPath,
    projectFolder: get().projectFolder,
    selectedComponents: get().components.filter((component) => component.selected),
    createDesktopShortcut: get().components.some((c) => c.id === "desktop_shortcut" && c.selected),
    createStartMenuShortcut: get().components.some((c) => c.id === "start_menu_shortcut" && c.selected),
    registerFileAssociations: get().components.some((c) => c.id === "file_associations" && c.selected)
  })
}));

