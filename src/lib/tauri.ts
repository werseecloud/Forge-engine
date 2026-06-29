import { invoke } from "@tauri-apps/api/core";
import type { AssetIndex, AssetMetadata, ImportAssetsRequest, ImportResult } from "../types/asset";
import type { DirectoryNode, WatcherStatus } from "../types/fs";
import type { CreateProjectRequest, OpenProjectResponse, ProjectSummary, ProjectValidation, AppDirectories } from "../types/project";
import type { SceneLevel, SceneObject, LevelSummary } from "../types/scene";
import type { AppSettings } from "../types/settings";

export const commands = {
  ensureAppDirectories: () => invoke<AppDirectories>("ensure_app_directories"),
  chooseDirectory: () => invoke<string | null>("choose_directory"),
  chooseFiles: () => invoke<string[]>("choose_files"),
  readDirectoryTree: (root: string) => invoke<DirectoryNode>("read_directory_tree", { root }),
  revealInExplorer: (path: string) => invoke<void>("reveal_in_explorer", { path }),
  watchProjectDirectory: (projectRoot: string) => invoke<WatcherStatus>("watch_project_directory", { projectRoot }),

  createProject: (request: CreateProjectRequest) => invoke<OpenProjectResponse>("create_project", { request }),
  openProject: (path: string) => invoke<OpenProjectResponse>("open_project", { path }),
  closeProject: () => invoke<void>("close_project"),
  listRecentProjects: () => invoke<ProjectSummary[]>("list_recent_projects"),
  pinProject: (rootPath: string) => invoke<ProjectSummary[]>("pin_project", { rootPath }),
  unpinProject: (rootPath: string) => invoke<ProjectSummary[]>("unpin_project", { rootPath }),
  revealProjectInExplorer: (rootPath: string) => invoke<void>("reveal_project_in_explorer", { rootPath }),
  validateProjectPath: (path: string) => invoke<ProjectValidation>("validate_project_path", { path }),
  repairProjectPath: (path: string) => invoke<OpenProjectResponse>("repair_project_path", { path }),

  importAssets: (request: ImportAssetsRequest) => invoke<ImportResult>("import_assets", { request }),
  scanAssets: (projectRoot: string) => invoke<AssetIndex>("scan_assets", { projectRoot }),
  rebuildAssetIndex: (projectRoot: string) => invoke<AssetIndex>("rebuild_asset_index", { projectRoot }),
  getAssetMetadata: (projectRoot: string, relativePath: string) =>
    invoke<AssetMetadata>("get_asset_metadata", { projectRoot, relativePath }),
  updateAssetMetadata: (projectRoot: string, relativePath: string, metadata: AssetMetadata) =>
    invoke<AssetMetadata>("update_asset_metadata", { projectRoot, relativePath, metadata }),
  deleteAsset: (projectRoot: string, relativePath: string) => invoke<AssetIndex>("delete_asset", { projectRoot, relativePath }),
  renameAsset: (projectRoot: string, relativePath: string, newName: string) =>
    invoke<AssetIndex>("rename_asset", { projectRoot, relativePath, newName }),
  moveAsset: (projectRoot: string, relativePath: string, destinationRelative: string) =>
    invoke<AssetIndex>("move_asset", { projectRoot, relativePath, destinationRelative }),
  duplicateAsset: (projectRoot: string, relativePath: string) => invoke<AssetIndex>("duplicate_asset", { projectRoot, relativePath }),

  createLevel: (projectRoot: string, name: string) => invoke<SceneLevel>("create_level", { request: { projectRoot, name } }),
  openLevel: (projectRoot: string, levelPath: string) => invoke<SceneLevel>("open_level", { projectRoot, levelPath }),
  saveLevel: (projectRoot: string, level: SceneLevel) => invoke<SceneLevel>("save_level", { projectRoot, level }),
  listLevels: (projectRoot: string) => invoke<LevelSummary[]>("list_levels", { projectRoot }),
  updateSceneObject: (projectRoot: string, levelPath: string, object: SceneObject) =>
    invoke<SceneLevel>("update_scene_object", { projectRoot, levelPath, object }),
  addSceneObject: (projectRoot: string, levelPath: string, name: string, assetReference?: string | null) =>
    invoke<SceneLevel>("add_scene_object", { projectRoot, levelPath, name, assetReference }),
  deleteSceneObject: (projectRoot: string, levelPath: string, objectId: string) =>
    invoke<SceneLevel>("delete_scene_object", { projectRoot, levelPath, objectId }),
  selectSceneObject: (projectRoot: string, levelPath: string, objectId: string) =>
    invoke<SceneObject | null>("select_scene_object", { projectRoot, levelPath, objectId }),

  getSettings: () => invoke<AppSettings>("get_settings"),
  updateSettings: (settings: AppSettings) => invoke<AppSettings>("update_settings", { settings }),
  resetSettings: () => invoke<AppSettings>("reset_settings"),
  setDefaultProjectsDir: (path: string) => invoke<AppSettings>("set_default_projects_dir", { path }),

  readOutputLog: () => invoke<string[]>("read_output_log"),
  appendOutputLog: (message: string) => invoke<string>("append_output_log", { message }),
  clearOutputLog: () => invoke<void>("clear_output_log")
};

