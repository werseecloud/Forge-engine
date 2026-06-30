export type SkyboxResolution = "Auto" | "2k" | "4k" | "8k" | "16k";

export interface SkyboxAsset {
  id: string;
  label: string;
  resolution: Exclude<SkyboxResolution, "Auto">;
  path: string;
  minDeviceMemoryGb: number;
  maxTextureSize: number;
}

export interface SkyboxManifest {
  skyboxes: SkyboxAsset[];
}

export interface SkyboxSettings {
  enabled: boolean;
  assetId: string;
  resolution: SkyboxResolution;
  intensity: number;
  blur: number;
  rotation: number;
  showAsBackground: boolean;
}

export const defaultSkyboxSettings: SkyboxSettings = {
  enabled: true,
  assetId: "citrus_orchard_puresky",
  resolution: "Auto",
  intensity: 1,
  blur: 0,
  rotation: 0,
  showAsBackground: true
};

export async function loadSkyboxManifest(): Promise<SkyboxManifest> {
  try {
    const manifest = await invoke<SkyboxManifest>("get_embedded_skybox_manifest");
    return {
      skyboxes: manifest.skyboxes.map((asset) => ({
        ...asset,
        path: convertFileSrc(asset.path)
      }))
    };
  } catch {
    const response = await fetch("/skyboxes/manifest.json");
    if (!response.ok) throw new Error(`Skybox manifest failed to load: ${response.status}`);
    return response.json() as Promise<SkyboxManifest>;
  }
}

export function chooseSkyboxAsset(manifest: SkyboxManifest, settings: SkyboxSettings): SkyboxAsset | null {
  const matches = manifest.skyboxes
    .filter((asset) => asset.id === settings.assetId)
    .sort((a, b) => resolutionRank(a.resolution) - resolutionRank(b.resolution));
  if (matches.length === 0) return null;
  if (settings.resolution !== "Auto") {
    return matches.find((asset) => asset.resolution === settings.resolution) ?? matches[0];
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const pixelRatio = window.devicePixelRatio || 1;
  const desired = memory >= 16 && cores >= 12 && pixelRatio <= 1.75
    ? "16k"
    : memory >= 8 && cores >= 8
      ? "8k"
      : memory >= 4
        ? "4k"
        : "2k";

  const rank = resolutionRank(desired);
  return [...matches].reverse().find((asset) => resolutionRank(asset.resolution) <= rank) ?? matches[0];
}

export function normalizeSkyboxSettings(value: unknown): SkyboxSettings {
  if (!value || typeof value !== "object") return defaultSkyboxSettings;
  const data = value as Partial<SkyboxSettings>;
  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : defaultSkyboxSettings.enabled,
    assetId: typeof data.assetId === "string" ? data.assetId : defaultSkyboxSettings.assetId,
    resolution: isResolution(data.resolution) ? data.resolution : defaultSkyboxSettings.resolution,
    intensity: clampNumber(data.intensity, 0, 8, defaultSkyboxSettings.intensity),
    blur: clampNumber(data.blur, 0, 1, defaultSkyboxSettings.blur),
    rotation: clampNumber(data.rotation, -180, 180, defaultSkyboxSettings.rotation),
    showAsBackground: typeof data.showAsBackground === "boolean" ? data.showAsBackground : defaultSkyboxSettings.showAsBackground
  };
}

function isResolution(value: unknown): value is SkyboxResolution {
  return value === "Auto" || value === "2k" || value === "4k" || value === "8k" || value === "16k";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function resolutionRank(value: SkyboxAsset["resolution"] | Exclude<SkyboxResolution, "Auto">) {
  if (value === "16k") return 4;
  if (value === "8k") return 3;
  if (value === "4k") return 2;
  return 1;
}
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
