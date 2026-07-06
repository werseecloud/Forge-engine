import type { SceneLevel } from "./scene";

export interface CreateWorldRequest {
  projectRoot: string;
  levelPath: string;
  config: WorldConfig;
}

export interface CreateWorldResult {
  world: ForgeWorldFile;
  level: SceneLevel;
  generatedFiles: string[];
  warnings: string[];
}

export type WorldType = "EmptyWorld" | "Grassland" | "Mountains" | "Forest" | "Desert" | "Snow" | "Island" | "RockyValley" | "ProceduralMixedWorld";
export type MapSize = "Small" | "Medium" | "Large" | "Huge" | "Custom";
export type QualityMode = "Auto" | "Low" | "Medium" | "High" | "Ultra";

export interface WorldConfig {
  worldName: string;
  worldType: WorldType;
  mapSize: MapSize;
  customMapSize: number | null;
  terrainResolution: number;
  seed: number;
  terrain: TerrainSettings;
  textures: TextureSettings;
  environment: EnvironmentSettings;
  performance: WorldPerformanceSettings;
}

export interface TerrainSettings {
  maxHeight: number;
  mountainHeight: number;
  hillStrength: number;
  valleyDepth: number;
  roughness: number;
  erosion: number;
  noiseScale: number;
  biomeBlending: number;
  waterLevel: number;
  flatSpawnArea: boolean;
  playerSpawnPoint: [number, number, number];
}

export interface TextureSettings {
  useStandardForgeTextures: boolean;
  usePbrTextures: boolean;
  textureResolution: QualityMode;
  autoOptimizeTextures: boolean;
  terrainMaterialPreset: string;
  blendByHeight: boolean;
  blendBySlope: boolean;
  blendByBiome: boolean;
  pbrLayers: WorldMaterialLayer[];
}

export interface WorldMaterialLayer {
  name: string;
  albedoTexture: string | null;
  normalTexture: string | null;
  roughnessTexture: string | null;
  metallicTexture: string | null;
  aoTexture: string | null;
  heightTexture: string | null;
  maskMap: string | null;
  tiling: number;
  strength: number;
  heightMin: number;
  heightMax: number;
  slopeMin: number;
  slopeMax: number;
  biomeMask: string | null;
}

export interface EnvironmentSettings {
  grassDensity: number;
  rockDensity: number;
  treeDensity: number;
  bushDensity: number;
  flowerDensity: number;
  randomObjectPlacement: boolean;
  objectScaleVariation: number;
  objectRotationVariation: number;
  avoidSpawnArea: boolean;
  avoidWater: boolean;
  alignObjectsToSlope: boolean;
}

export interface WorldPerformanceSettings {
  autoDetectPcPerformance: boolean;
  textureQuality: QualityMode;
  terrainLod: QualityMode;
  grassQuality: QualityMode;
  rockQuality: QualityMode;
  foliageDistance: number;
  objectDensityMultiplier: number;
  terrainChunks: boolean;
  streaming: boolean;
  occlusionCulling: boolean;
  impostors: boolean;
  textureCompression: boolean;
}

export interface ForgeWorldFile {
  fileType: string;
  name: string;
  worldId: string;
  seed: number;
  mapSize: number;
  terrainResolution: number;
  maxHeight: number;
  mountainHeight: number;
  performanceMode: QualityMode;
  materials: WorldMaterialLayer[];
  scatterLayers: ScatterLayerMetadata[];
  terrain: TerrainOutputMetadata;
  createdWith: string;
}

export interface TerrainOutputMetadata {
  heightmapPath: string;
  splatmapPath: string;
  sampleResolution: number;
  chunkSize: number;
  chunkCount: number;
  waterLevel: number;
  worldBounds: [number, number, number, number];
}

export interface ScatterLayerMetadata {
  name: string;
  category: string;
  instanceCount: number;
  density: number;
  distanceCulling: number;
}
