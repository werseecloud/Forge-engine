import { Upload } from "lucide-react";
import { commands } from "../../lib/tauri";
import { useAssetStore } from "../../stores/useAssetStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { PillButton } from "../shared/PillButton";

interface ImportButtonProps {
  onImportStatus: (message: string) => void;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ImportButton({ onImportStatus, onRefresh, onError, onSuccess }: ImportButtonProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const currentFolder = useAssetStore((state) => state.currentFolder);

  async function importFiles(sourcePaths?: string[]) {
    if (!currentProject) {
      onError("Open a project before importing assets.");
      return;
    }
    const paths = sourcePaths ?? await commands.chooseFiles();
    if (paths.length === 0) return;
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
      if (result.errors.length > 0) onError(result.errors.join("\n"));
      else onSuccess(message);
    } catch (error) {
      onError(String(error));
    }
  }

  return <PillButton onClick={() => void importFiles()} icon={<Upload size={15} />}>Import</PillButton>;
}

