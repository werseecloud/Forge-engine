import { invoke } from "@tauri-apps/api/core";
import type { AssetIndex, AssetMetadata, ImportAssetsRequest, ImportResult } from "../types/asset";
import type { DirectoryNode, WatcherStatus } from "../types/fs";
import type { CreateProjectRequest, OpenProjectResponse, ProjectSummary, ProjectValidation, AppDirectories } from "../types/project";
import type { SceneLevel, SceneObject, LevelSummary } from "../types/scene";
import type { AppSettings } from "../types/settings";
import type { CreateWorldRequest, CreateWorldResult, WorldAssetManifest } from "../types/world";
import type {
  AiCompatibilityReport,
  AiContext,
  AiContextRequest,
  AiGenerationResult,
  AiPermissionSet,
  AiPrompt,
  AiProposedAction,
  AiToolDescriptor,
  GenerateOptions,
  HardwareProfile,
  InstalledModel,
  ModelStatus
} from "../types/ai";
import type {
  AnimationDatabase,
  AnimationSelectionInput,
  AnimationSelectionResult,
  CharacterImportRequest,
  CharacterImportResult,
  CharacterRuntimePlan,
  DefaultCharacterAssets,
  GeneratedAnimationStateMachine,
  HumanoidDetectionResult
} from "../types/character";
import type { BlueprintCompileResult, BlueprintGraph, BlueprintGraphSummary, BlueprintRunResult } from "../features/blueprints/types/blueprint-types";

export interface EngineBootStep {
  component: string;
  command: string;
  status: string;
  stdout: string;
  stderr: string;
}

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
  ,
  startEngineServices: () => invoke<EngineBootStep[]>("start_engine_services"),

  listBlueprintGraphs: (projectRoot: string) => invoke<BlueprintGraphSummary[]>("list_blueprint_graphs", { projectRoot }),
  createBlueprintGraph: (projectRoot: string, name: string, graphType: string) =>
    invoke<BlueprintGraph>("create_blueprint_graph", { projectRoot, name, graphType }),
  readBlueprintGraph: (projectRoot: string, relativePath: string) =>
    invoke<BlueprintGraph>("read_blueprint_graph", { projectRoot, relativePath }),
  saveBlueprintGraph: (projectRoot: string, graph: BlueprintGraph) =>
    invoke<BlueprintGraph>("save_blueprint_graph", { projectRoot, graph }),
  deleteBlueprintGraph: (projectRoot: string, relativePath: string) =>
    invoke<void>("delete_blueprint_graph", { projectRoot, relativePath }),
  duplicateBlueprintGraph: (projectRoot: string, relativePath: string, newName: string) =>
    invoke<BlueprintGraph>("duplicate_blueprint_graph", { projectRoot, relativePath, newName }),
  compileBlueprintGraph: (graph: BlueprintGraph) => invoke<BlueprintCompileResult>("compile_blueprint_graph", { graph }),
  runBlueprintPreview: (graph: BlueprintGraph) => invoke<BlueprintRunResult>("run_blueprint_preview", { graph })
  ,
  detectHumanoid: (characterSourcePath: string) =>
    invoke<HumanoidDetectionResult>("detect_humanoid", { characterSourcePath }),
  discoverDefaultCharacterAssets: () =>
    invoke<DefaultCharacterAssets>("discover_default_character_assets"),
  indexAnimationPacks: (animationPackPaths: string[]) =>
    invoke<AnimationDatabase>("index_animation_packs", { animationPackPaths }),
  importCharacter: (request: CharacterImportRequest) =>
    invoke<CharacterImportResult>("import_character", { request }),
  buildCharacterRuntimePlan: (projectRoot: string, characterManifestPath: string) =>
    invoke<CharacterRuntimePlan>("build_character_runtime_plan", { projectRoot, characterManifestPath }),
  selectProceduralAnimation: (input: AnimationSelectionInput) =>
    invoke<AnimationSelectionResult>("select_procedural_animation", { input }),
  generateAnimationStateMachine: (animationDatabasePath: string) =>
    invoke<GeneratedAnimationStateMachine>("generate_animation_state_machine", { animationDatabasePath }),

  createWorld: (request: CreateWorldRequest) => invoke<CreateWorldResult>("create_world", { request }),
  discoverWorldAssets: () => invoke<WorldAssetManifest>("discover_world_assets"),

  aiProbeDevice: () => invoke<AiCompatibilityReport>("ai_probe_device"),
  aiGetDeviceProfile: () => invoke<HardwareProfile>("ai_get_device_profile"),
  aiListInstalledModels: () => invoke<InstalledModel[]>("ai_list_installed_models"),
  aiImportModel: (path: string) => invoke<InstalledModel>("ai_import_model", { path }),
  aiValidateModel: (modelId: string) => invoke<ModelStatus>("ai_validate_model", { modelId }),
  aiSelectModel: (modelId: string) => invoke<InstalledModel>("ai_select_model", { modelId }),
  aiLoadModel: (modelId: string) => invoke<{ modelId: string; backend: string; loaded: boolean }>("ai_load_model", { modelId }),
  aiUnloadModel: (modelId: string) => invoke<void>("ai_unload_model", { modelId }),
  aiGetModelStatus: (modelId: string) => invoke<ModelStatus>("ai_get_model_status", { modelId }),
  aiGetRecommendedModels: () => invoke<AiCompatibilityReport>("ai_get_recommended_models"),
  aiGenerate: (prompt: AiPrompt, options: GenerateOptions) => invoke<AiGenerationResult>("ai_generate", { prompt, options }),
  aiCancelGeneration: (jobId: string) => invoke<void>("ai_cancel_generation", { jobId }),
  aiBuildContext: (request: AiContextRequest) => invoke<AiContext>("ai_build_context", { request }),
  aiGetAvailableTools: () => invoke<AiToolDescriptor[]>("ai_get_available_tools"),
  aiProposeActions: (userPrompt: string, context: AiContext) => invoke<AiProposedAction[]>("ai_propose_actions", { userPrompt, context }),
  aiApplyAction: (actionId: string) => invoke<AiProposedAction>("ai_apply_action", { actionId }),
  aiRejectAction: (actionId: string) => invoke<void>("ai_reject_action", { actionId }),
  aiPreviewAction: (actionId: string) => invoke<AiProposedAction>("ai_preview_action", { actionId }),
  aiGetPermissions: () => invoke<AiPermissionSet>("ai_get_permissions"),
  aiSetPermissions: (permissions: AiPermissionSet) => invoke<AiPermissionSet>("ai_set_permissions", { permissions }),
  aiEnableOfflineMode: (value: boolean) => invoke<AiPermissionSet>("ai_enable_offline_mode", { value }),
  aiGetLogs: () => invoke<string[]>("ai_get_logs"),
  aiClearLogs: () => invoke<void>("ai_clear_logs")
};
