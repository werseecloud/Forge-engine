export interface DirectoryNode {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  children: DirectoryNode[];
}

export interface WatcherStatus {
  projectRoot: string;
  active: boolean;
  mode: string;
}

