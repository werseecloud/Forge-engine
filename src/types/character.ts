export interface CharacterImportRequest {
  projectRoot: string;
  characterSourcePath: string;
  animationPackPaths: string[];
  characterName?: string | null;
  placeInLevelPath?: string | null;
}

export interface CharacterImportResult {
  character: CharacterAsset;
  humanoid: HumanoidDetectionResult;
  animationDatabase: AnimationDatabase;
  placedObjectId: string | null;
  generatedFiles: string[];
  warnings: string[];
}

export interface CharacterAsset {
  characterId: string;
  name: string;
  sourceGlb: string;
  projectCharacterPath: string;
  modelRelativePath: string;
  rigPath: string;
  animationDatabasePath: string;
  controllerPath: string;
  rig: ForgeAutoRig;
  controller: PlayerControllerProfile;
}

export interface HumanoidDetectionResult {
  isHumanoid: boolean;
  confidence: number;
  bonesFound: string[];
  missingBones: string[];
  skeletonBoneCount: number;
  meshCount: number;
  animationCount: number;
}

export interface ForgeAutoRig {
  rigId: string;
  rigType: string;
  retargetProfile: string;
  boneMap: Record<string, string>;
  humanoidSlots: string[];
  footIk: FootIkSettings;
}

export interface FootIkSettings {
  enabled: boolean;
  leftFootBone: string | null;
  rightFootBone: string | null;
  pelvisBone: string | null;
  traceDistance: number;
  blendSpeed: number;
}

export interface AnimationDatabase {
  databaseId: string;
  indexedAt: string;
  packs: AnimationPackRecord[];
  clips: AnimationClipRecord[];
  locomotionSets: Record<string, string[]>;
}

export interface AnimationPackRecord {
  path: string;
  displayName: string;
  sizeBytes: number;
  clipCount: number;
}

export interface AnimationClipRecord {
  id: string;
  name: string;
  sourcePack: string;
  relativePath: string;
  sizeBytes: number;
  tags: string[];
  locomotion: string | null;
  durationSeconds: number | null;
}

export interface PlayerControllerProfile {
  controllerId: string;
  wasdEnabled: boolean;
  sprintKey: string;
  jumpKey: string;
  crouchKey: string;
  movementBlend: MovementBlendSettings;
  states: string[];
}

export interface MovementBlendSettings {
  idleToWalk: number;
  walkToRun: number;
  runToSprint: number;
  strafeBlend: number;
  turnBlend: number;
  leanStrength: number;
}

export interface CharacterRuntimePlan {
  characterId: string;
  controllerPath: string;
  animationDatabasePath: string;
  requiredStates: string[];
  missingStates: string[];
  playable: boolean;
}

export interface DefaultCharacterAssets {
  characterModelPath: string | null;
  animationPackPaths: string[];
  searchedRoots: string[];
}

export interface AnimationSelectionInput {
  animationDatabasePath: string;
  velocity: Vec3Input;
  acceleration: Vec3Input;
  grounded: boolean;
  jumpPressed: boolean;
  crouching: boolean;
  sprinting: boolean;
  cameraForward: Vec3Input;
  lastState?: string | null;
}

export interface Vec3Input {
  x: number;
  y: number;
  z: number;
}

export interface AnimationSelectionResult {
  selectedState: string;
  selectedClip: AnimationClipRecord | null;
  blendSeconds: number;
  speed: number;
  direction: string;
  reasons: string[];
  warnings: string[];
}

export interface GeneratedAnimationStateMachine {
  states: AnimationStateDefinition[];
  transitions: AnimationTransitionDefinition[];
  missingStates: string[];
}

export interface AnimationStateDefinition {
  state: string;
  clipIds: string[];
}

export interface AnimationTransitionDefinition {
  from: string;
  to: string;
  condition: string;
  blendSeconds: number;
}
