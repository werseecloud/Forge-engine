export type RendererPath = "ForwardPlus" | "Deferred" | "HybridRayTracing" | "PathTracing";
export type QualityPreset = "Low" | "Medium" | "High" | "Ultra" | "Cinematic";
export type DebugView =
  | "Lit"
  | "Unlit"
  | "Albedo"
  | "Normals"
  | "Roughness"
  | "Metallic"
  | "Depth"
  | "MotionVectors"
  | "LightClusters"
  | "ShadowCascades"
  | "Wireframe"
  | "Overdraw"
  | "GpuTimings"
  | "PathTracingAccumulation";

export interface PathTracingSettings {
  samplesPerPixel: number;
  maxBounces: number;
  denoiserEnabled: boolean;
  resolutionScale: number;
  fireflyClamp: number;
  environmentIntensity: number;
}

export interface GraphicsSettings {
  rendererPath: RendererPath;
  qualityPreset: QualityPreset;
  rayTracedShadows: boolean;
  rayTracedReflections: boolean;
  rayTracedAo: boolean;
  rayTracedGi: boolean;
  pathTracing: PathTracingSettings;
  giMode: string;
  shadowQuality: string;
  reflectionQuality: string;
  volumetricQuality: string;
  dynamicResolution: boolean;
  resolutionScale: number;
  textureBudgetMb: number;
  maxLights: number;
  vsync: boolean;
  frameLimiter: number | null;
  debugView: DebugView;
}

export interface BackendCapabilities {
  supportsCompute: boolean;
  supportsTimestampQueries: boolean;
  supportsPipelineCache: boolean;
  supportsBindlessResources: boolean;
  supportsMeshShaders: boolean;
  supportsRayTracing: boolean;
  supportsRayQueries: boolean;
  supportsRayTracingPipeline: boolean;
  supportsVariableRateShading: boolean;
  supportsSamplerFeedback: boolean;
  supportsTextureCompressionBc: boolean;
  supportsTextureCompressionAstc: boolean;
  supportsTextureCompressionEtc2: boolean;
  supportsHdrSurface: boolean;
  supportsDepthClipControl: boolean;
  maxTextureSize: number;
  maxBindGroups: number;
  maxStorageBuffers: number;
  maxSampledTextures: number;
  maxLightsPerCluster: number;
  backendName: string;
  adapterName: string;
  vendorId: number | null;
  deviceId: number | null;
}

export interface GpuStats {
  frameIndex: number;
  frameTimeMs: number;
  cpuTimeMs: number;
  gpuTimeMs: number | null;
  drawCalls: number;
  triangleCount: number;
  visibleObjects: number;
  lightCount: number;
  vramEstimateMb: number;
  shaderCompilations: number;
  pipelineCacheHits: number;
  pipelineCacheMisses: number;
  backendName: string;
  adapterName: string | null;
}

export type FeatureStatus = "Implemented" | "Partial" | "Planned" | "Unsupported";

export interface RendererFeatureMatrix {
  deferredGbuffer: FeatureStatus;
  clusteredForwardPlus: FeatureStatus;
  ssao: FeatureStatus;
  ssr: FeatureStatus;
  progressivePathTracing: FeatureStatus;
  computeBvhFallback: FeatureStatus;
  hardwareRayTracingAbstraction: FeatureStatus;
  mobileVulkanMetalDemo: FeatureStatus;
  browserWebgpuDemo: FeatureStatus;
}
