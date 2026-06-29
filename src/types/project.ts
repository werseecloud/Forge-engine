import type { AssetIndex } from "./asset";
import type { LevelSummary } from "./scene";

export interface AppDirectories {
  documentsRoot: string;
  projectsDir: string;
  templatesDir: string;
  backupsDir: string;
  localRoot: string;
  cacheDir: string;
  logsDir: string;
  shaderCacheDir: string;
  tempDir: string;
  roamingRoot: string;
  settingsPath: string;
}

export interface ProjectManifest {
  projectId: string;
  projectName: string;
  description: string;
  engineVersion: string;
  createdAt: string;
  lastOpenedAt: string;
  rootPath: string;
  defaultScene: string | null;
  projectSettingsPath: string;
  contentRoot: string;
  assetIndexPath: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  rootPath: string;
  manifestPath: string;
  lastOpenedAt: string;
  pinned: boolean;
}

export interface CreateProjectRequest {
  projectName: string;
  location: string;
  description: string;
  template: string;
  renderBackend: string;
  targetPlatform: string;
  starterContent: boolean;
  sourceControlIgnore: boolean;
  createDefaultScene: boolean;
}

export interface OpenProjectResponse {
  manifest: ProjectManifest;
  levels: LevelSummary[];
  assetIndex: AssetIndex;
}

export interface ProjectValidation {
  valid: boolean;
  manifestPath: string | null;
  message: string;
}

