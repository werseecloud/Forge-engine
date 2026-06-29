export interface AssetMetadata {
  assetId: string;
  fileName: string;
  relativePath: string;
  assetType: string;
  fileSize: number;
  extension: string;
  importedAt: string;
  modifiedAt: string;
  sourcePathHash: string;
  thumbnailPath: string | null;
  tags: string[];
  importSettings: Record<string, unknown>;
  dependencies: string[];
  engineVersion: string;
}

export interface AssetIndex {
  projectRoot: string;
  rebuiltAt: string;
  assets: AssetMetadata[];
}

export interface ImportAssetsRequest {
  projectRoot: string;
  sourcePaths: string[];
  destinationRelative: string;
  conflictStrategy: "replace" | "keepBoth" | "skip";
}

export interface ImportResult {
  imported: AssetMetadata[];
  skipped: string[];
  errors: string[];
}

