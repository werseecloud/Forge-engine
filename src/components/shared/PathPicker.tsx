import { FolderOpen } from "lucide-react";
import { commands } from "../../lib/tauri";
import { IconButton } from "./IconButton";

interface PathPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PathPicker({ value, onChange, placeholder = "Choose folder" }: PathPickerProps) {
  async function pick() {
    const path = await commands.chooseDirectory();
    if (path) onChange(path);
  }

  return (
    <div className="path-picker">
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <IconButton label="Choose folder" onClick={pick}>
        <FolderOpen size={16} />
      </IconButton>
    </div>
  );
}

