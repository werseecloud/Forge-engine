export function joinContentPath(folder: string, fileName: string): string {
  const cleanFolder = folder.replace(/^Content[\\/]/, "").replace(/\\/g, "/").replace(/\/$/, "");
  return cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
}

export function parentFolder(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, "/").split("/");
  parts.pop();
  return parts.join("/");
}

