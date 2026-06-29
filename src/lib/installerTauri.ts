import { invoke } from "@tauri-apps/api/core";
import type { CheckResult, ExistingInstall, HealthCheckResult, InstallConfig, InstallerComponent, InstallPlan, InstallResult, PathValidation, UserPaths } from "../types/installer";

export const installerApi = {
  getWindowsUserPaths: () => invoke<UserPaths>("get_windows_user_paths"),
  runSystemCheck: (installPath?: string, projectFolder?: string) => invoke<CheckResult[]>("run_system_check", { installPath, projectFolder }),
  checkExistingInstall: (path?: string) => invoke<ExistingInstall>("check_existing_install", { path }),
  validateInstallPath: (path: string) => invoke<PathValidation>("validate_install_path", { path }),
  validateProjectFolder: (path: string, installPath: string) => invoke<PathValidation>("validate_project_folder", { path, installPath }),
  scanAvailableComponents: (installPath: string) => invoke<InstallerComponent[]>("scan_available_components", { installPath }),
  createInstallPlan: (config: InstallConfig) => invoke<InstallPlan>("create_install_plan", { config }),
  runInstallPlan: (config: InstallConfig) => invoke<InstallResult>("run_install_plan", { config }),
  runHealthChecks: (config: InstallConfig) => invoke<HealthCheckResult[]>("run_component_health_checks", { config }),
  chooseDirectory: () => invoke<string | null>("choose_directory"),
  openFolder: (path: string) => invoke<void>("open_folder", { path }),
  readLog: () => invoke<string[]>("read_installer_log")
};

