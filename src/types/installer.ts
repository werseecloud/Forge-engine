export interface CheckResult {
  id: string;
  label: string;
  status: "passed" | "failed" | "warning";
  value: string;
  message: string;
  blocking: boolean;
}

export interface UserPaths {
  installDefault: string;
  documentsRoot: string;
  projectsDir: string;
  templatesDir: string;
  backupsDir: string;
  exportsDir: string;
  localRoot: string;
  cacheDir: string;
  shaderCacheDir: string;
  assetCacheDir: string;
  buildCacheDir: string;
  logsDir: string;
  tempDir: string;
  crashReportsDir: string;
  workerLogsDir: string;
  roamingRoot: string;
  settingsPath: string;
  installerStatePath: string;
}

export interface InstallerComponent {
  id: string;
  displayName: string;
  binaryName: string;
  required: boolean;
  optional: boolean;
  selected: boolean;
  available: boolean;
  sizeBytes: number;
  sourcePath: string | null;
  destinationPath: string;
  error: string | null;
}

export interface ExistingInstall {
  found: boolean;
  installPath: string;
  installedVersion: string | null;
  manifestPath: string | null;
  message: string;
}

export interface PathValidation {
  valid: boolean;
  warning: string | null;
  message: string;
  availableSpace: number;
}

export interface InstallConfig {
  installMode: string;
  installPath: string;
  projectFolder: string;
  selectedComponents: InstallerComponent[];
  createDesktopShortcut: boolean;
  createStartMenuShortcut: boolean;
  registerFileAssociations: boolean;
}

export interface InstallPlan {
  installPath: string;
  projectFolder: string;
  components: InstallerComponent[];
  totalSizeBytes: number;
  steps: string[];
}

export interface HealthCheckResult {
  componentId: string;
  displayName: string;
  status: "passed" | "failed" | "warning";
  message: string;
  stdout: string;
  stderr: string;
}

export interface InstallResult {
  success: boolean;
  manifestPath: string;
  versionPath: string;
  healthChecks: HealthCheckResult[];
  errors: string[];
}

