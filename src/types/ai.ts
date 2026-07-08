export type DeviceTier = "Low" | "Standard" | "High" | "Ultra";
export type PermissionMode = "ReadOnly" | "Suggest" | "ApplyWithConfirmation" | "AutopilotProjectMode";

export interface HardwareProfile {
  os: string;
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  ramGb: number;
  availableRamGb: number | null;
  gpuName: string | null;
  vramGb: number | null;
  diskAvailableGb: number | null;
  batteryPower: boolean | null;
}

export interface RecommendedModel {
  name: string;
  family: string;
  parameterSize: string;
  quantization: string;
  minimumRamGb: number;
  notes: string;
}

export interface AiCompatibilityReport {
  hardware: HardwareProfile;
  deviceTier: DeviceTier;
  canRunLocalAi: boolean;
  recommendedPack: string;
  recommendedModels: RecommendedModel[];
  warnings: string[];
  minimumDiskRequiredGb: number;
  expectedPerformance: string;
}

export interface ForgeModelMetadata {
  modelType: string;
  name: string;
  family: string;
  format: string;
  quantization: string;
  parameterSize: string;
  contextLength: number;
  recommendedRamGb: number;
  recommendedVramGb: number;
  offline: boolean;
  supportsTools: boolean;
  supportsCode: boolean;
  supportsSceneEditing: boolean;
  modelFile: string;
}

export interface ModelStatus {
  modelId: string;
  loaded: boolean;
  loading: boolean;
  health: string;
  memoryUsageMb: number;
  tokenUsage: number;
  error: string | null;
}

export interface InstalledModel {
  modelId: string;
  metadata: ForgeModelMetadata;
  modelPath: string;
  metadataPath: string;
  sizeBytes: number;
  installedAt: string;
  active: boolean;
  status: ModelStatus;
}

export interface AiPermissionSet {
  mode: PermissionMode;
  allowReadScene: boolean;
  allowEditScene: boolean;
  allowEditScripts: boolean;
  allowEditBlueprints: boolean;
  allowCreateAssets: boolean;
  allowProjectAnalysis: boolean;
  requireConfirmation: boolean;
  localOnly: boolean;
  cloudEnabled: boolean;
}

export interface AiContextRequest {
  projectRoot?: string | null;
  selectedEntityJson?: string | null;
  activeLevelJson?: string | null;
  assetIndexJson?: string | null;
  activeBlueprintGraphJson?: string | null;
  activeFilePath?: string | null;
  diagnostics: string[];
  userIntent?: string | null;
}

export interface AiContext {
  summary: string;
  projectRoot: string | null;
  selectedEntity: string | null;
  activeLevel: string | null;
  activeLevelPath: string | null;
  assetIndex: string | null;
  activeBlueprintGraph: string | null;
  activeFile: string | null;
  diagnostics: string[];
  allowedTools: string[];
}

export interface AiProposedAction {
  actionId: string;
  title: string;
  description: string;
  target: string;
  before: string | null;
  after: string | null;
  risk: string;
  requiresConfirmation: boolean;
  toolName: string;
  operation: string;
  payload: unknown;
  projectRoot: string | null;
  levelPath: string | null;
  applied: boolean;
  result: string | null;
}

export interface AiToolDescriptor {
  name: string;
  category: string;
  description: string;
  destructive: boolean;
  requiresConfirmation: boolean;
}

export interface AiPrompt {
  system: string;
  user: string;
  context: string | null;
}

export interface GenerateOptions {
  maxTokens: number;
  temperature: number;
  stream: boolean;
  localOnly: boolean;
}

export interface AiGenerationResult {
  jobId: string;
  text: string;
  finishReason: string;
  promptTokens: number;
  completionTokens: number;
  modelId: string | null;
  warnings: string[];
}
