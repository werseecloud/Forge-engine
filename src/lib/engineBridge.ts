import { invoke } from "@tauri-apps/api/core";
import type { BackendCapabilities, GpuStats, GraphicsSettings } from "../types/renderer";

export const engineBridge = {
  getBackendCapabilities: () => invoke<BackendCapabilities>("get_backend_capabilities"),
  getRendererSettings: () => invoke<GraphicsSettings>("get_renderer_settings"),
  updateRendererSettings: (settings: GraphicsSettings) => invoke<GraphicsSettings>("update_renderer_settings", { settings }),
  getGpuStats: () => invoke<GpuStats>("get_gpu_stats"),
  resetPathTracingAccumulation: () => invoke<string>("reset_path_tracing_accumulation")
};
