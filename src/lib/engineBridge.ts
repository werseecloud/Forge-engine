import { invoke } from "@tauri-apps/api/core";
import type { BackendCapabilities, GpuStats, GraphicsSettings, RendererFeatureMatrix } from "../types/renderer";

export const engineBridge = {
  getBackendCapabilities: () => invoke<BackendCapabilities>("get_backend_capabilities"),
  getRendererSettings: () => invoke<GraphicsSettings>("get_renderer_settings"),
  updateRendererSettings: (settings: GraphicsSettings) => invoke<GraphicsSettings>("update_renderer_settings", { settings }),
  getGpuStats: () => invoke<GpuStats>("get_gpu_stats"),
  getRendererFeatureMatrix: () => invoke<RendererFeatureMatrix>("get_renderer_feature_matrix"),
  resetPathTracingAccumulation: () => invoke<string>("reset_path_tracing_accumulation")
};
