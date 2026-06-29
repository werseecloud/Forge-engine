import { create } from "zustand";
import type { AssetIndex, AssetMetadata } from "../types/asset";
import type { DirectoryNode } from "../types/fs";

interface AssetState {
  currentFolder: string;
  folderTree: DirectoryNode | null;
  assetIndex: AssetIndex | null;
  selectedAssets: AssetMetadata[];
  importQueue: string[];
  contentFilter: string;
  searchQuery: string;
  thumbnailSize: number;
  setCurrentFolder: (currentFolder: string) => void;
  setFolderTree: (folderTree: DirectoryNode | null) => void;
  setAssetIndex: (assetIndex: AssetIndex | null) => void;
  setSelectedAssets: (selectedAssets: AssetMetadata[]) => void;
  setImportQueue: (importQueue: string[]) => void;
  setContentFilter: (contentFilter: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  setThumbnailSize: (thumbnailSize: number) => void;
}

export const useAssetStore = create<AssetState>((set) => ({
  currentFolder: "",
  folderTree: null,
  assetIndex: null,
  selectedAssets: [],
  importQueue: [],
  contentFilter: "All",
  searchQuery: "",
  thumbnailSize: 148,
  setCurrentFolder: (currentFolder) => set({ currentFolder }),
  setFolderTree: (folderTree) => set({ folderTree }),
  setAssetIndex: (assetIndex) => set({ assetIndex }),
  setSelectedAssets: (selectedAssets) => set({ selectedAssets }),
  setImportQueue: (importQueue) => set({ importQueue }),
  setContentFilter: (contentFilter) => set({ contentFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setThumbnailSize: (thumbnailSize) => set({ thumbnailSize })
}));

