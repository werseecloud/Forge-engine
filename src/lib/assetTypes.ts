import { Box, Code2, File, FileAudio, FileImage, Film, Layers3, Palette, ScrollText, Sparkles } from "lucide-react";
import type { AssetMetadata } from "../types/asset";

export const contentFilters = ["All", "Blueprints", "Materials", "Meshes", "Textures", "Audio", "Scenes", "UI", "VFX", "Data"] as const;
export type ContentFilter = (typeof contentFilters)[number];

export function matchesFilter(asset: AssetMetadata, filter: ContentFilter): boolean {
  if (filter === "All") return true;
  const normalized = filter.slice(0, -1).toLowerCase();
  if (filter === "Meshes") return asset.assetType === "Mesh";
  if (filter === "Scenes") return asset.assetType === "Scene";
  return asset.assetType.toLowerCase() === normalized;
}

export function iconForAsset(asset: AssetMetadata) {
  switch (asset.assetType) {
    case "Mesh":
      return Box;
    case "Texture":
      return FileImage;
    case "Audio":
      return FileAudio;
    case "Scene":
      return Layers3;
    case "Blueprint":
      return Code2;
    case "Material":
      return Palette;
    case "Prefab":
      return Sparkles;
    case "Data":
      return ScrollText;
    default:
      return File;
  }
}

