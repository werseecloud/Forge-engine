import { Folder, FolderOpen } from "lucide-react";
import type { DirectoryNode } from "../../types/fs";
import { useAssetStore } from "../../stores/useAssetStore";

interface AssetFolderTreeProps {
  node: DirectoryNode | null;
}

export function AssetFolderTree({ node }: AssetFolderTreeProps) {
  if (!node) return <div className="inline-empty">No content folder.</div>;
  return <FolderNode node={node} depth={0} />;
}

function FolderNode({ node, depth }: { node: DirectoryNode; depth: number }) {
  const currentFolder = useAssetStore((state) => state.currentFolder);
  const setCurrentFolder = useAssetStore((state) => state.setCurrentFolder);
  if (!node.isDirectory) return null;

  const folderPath = node.relativePath === node.name ? "" : node.relativePath;
  const selected = currentFolder === folderPath;
  const folders = node.children.filter((child) => child.isDirectory);

  return (
    <div>
      <button className={selected ? "folder-node is-selected" : "folder-node"} style={{ paddingLeft: 10 + depth * 12 }} onClick={() => setCurrentFolder(folderPath)}>
        {selected ? <FolderOpen size={14} /> : <Folder size={14} />}
        <span>{depth === 0 ? "Content" : node.name}</span>
      </button>
      {folders.map((child) => <FolderNode key={child.path} node={child} depth={depth + 1} />)}
    </div>
  );
}

