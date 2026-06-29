import { Filter, Grid2X2, List, Plus, Search } from "lucide-react";
import { useMemo } from "react";
import type { DragEvent } from "react";
import { matchesFilter, type ContentFilter } from "../../lib/assetTypes";
import { parentFolder } from "../../lib/paths";
import { commands } from "../../lib/tauri";
import { useAssetStore } from "../../stores/useAssetStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";
import { PillButton } from "../shared/PillButton";
import { AssetFolderTree } from "./AssetFolderTree";
import { AssetGrid } from "./AssetGrid";
import { Breadcrumbs } from "./Breadcrumbs";
import { ContentFilterPills } from "./ContentFilterPills";
import { ImportButton } from "./ImportButton";

interface ContentBrowserProps {
  onImportStatus: (message: string) => void;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ContentBrowser({ onImportStatus, onRefresh, onError, onSuccess }: ContentBrowserProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const folderTree = useAssetStore((state) => state.folderTree);
  const assetIndex = useAssetStore((state) => state.assetIndex);
  const currentFolder = useAssetStore((state) => state.currentFolder);
  const contentFilter = useAssetStore((state) => state.contentFilter) as ContentFilter;
  const searchQuery = useAssetStore((state) => state.searchQuery);
  const setSearchQuery = useAssetStore((state) => state.setSearchQuery);
  const thumbnailSize = useAssetStore((state) => state.thumbnailSize);
  const setThumbnailSize = useAssetStore((state) => state.setThumbnailSize);

  const visibleAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (assetIndex?.assets ?? []).filter((asset) => {
      const inFolder = query ? true : parentFolder(asset.relativePath) === currentFolder;
      const byFilter = matchesFilter(asset, contentFilter);
      const bySearch = !query || asset.fileName.toLowerCase().includes(query) || asset.relativePath.toLowerCase().includes(query);
      return inFolder && byFilter && bySearch;
    });
  }, [assetIndex?.assets, contentFilter, currentFolder, searchQuery]);

  async function importDroppedFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!currentProject) return;
    const paths = Array.from(event.dataTransfer.files)
      .map((file) => (file as File & { path?: string }).path)
      .filter((path): path is string => Boolean(path));
    if (paths.length === 0) {
      onError("No readable local file paths were provided by the drop event. Use Import instead.");
      return;
    }
    try {
      const result = await commands.importAssets({
        projectRoot: currentProject.rootPath,
        sourcePaths: paths,
        destinationRelative: currentFolder,
        conflictStrategy: "keepBoth"
      });
      await onRefresh();
      const message = `${result.imported.length} imported, ${result.skipped.length} skipped, ${result.errors.length} errors`;
      onImportStatus(message);
      result.errors.length > 0 ? onError(result.errors.join("\n")) : onSuccess(message);
    } catch (error) {
      onError(String(error));
    }
  }

  if (!currentProject) {
    return (
      <div className="content-browser is-disabled">
        <EmptyState title="No project open" detail="Create or open a project to browse Content files." />
      </div>
    );
  }

  return (
    <div className="content-browser" onDragOver={(event) => event.preventDefault()} onDrop={importDroppedFiles}>
      <aside className="content-tree">
        <AssetFolderTree node={folderTree} />
      </aside>
      <section className="content-main">
        <div className="content-toolbar">
          <div className="content-actions">
            <ImportButton onImportStatus={onImportStatus} onRefresh={onRefresh} onError={onError} onSuccess={onSuccess} />
            <PillButton icon={<Plus size={15} />}>Add</PillButton>
          </div>
          <Breadcrumbs />
          <div className="content-search">
            <Search size={15} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search assets..." />
            <IconButton label="Filter"><Filter size={15} /></IconButton>
          </div>
        </div>
        <ContentFilterPills />
        <div className="content-grid-shell">
          <AssetGrid assets={visibleAssets} thumbnailSize={thumbnailSize} />
        </div>
        <div className="content-footer">
          <span>{visibleAssets.length} item{visibleAssets.length === 1 ? "" : "s"}</span>
          <IconButton label="Grid view" active><Grid2X2 size={14} /></IconButton>
          <IconButton label="List view"><List size={14} /></IconButton>
          <input type="range" min="112" max="210" value={thumbnailSize} onChange={(event) => setThumbnailSize(Number(event.target.value))} />
        </div>
      </section>
    </div>
  );
}
