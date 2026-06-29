import { installerApi } from "../lib/installerTauri";
import { SecondaryButton } from "./InstallerButtons";

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PathInput({ value, onChange }: PathInputProps) {
  return (
    <div className="path-input">
      <input value={value} onChange={(event) => onChange(event.target.value)} />
      <SecondaryButton onClick={async () => {
        const selected = await installerApi.chooseDirectory();
        if (selected) onChange(selected);
      }}>Browse...</SecondaryButton>
    </div>
  );
}

