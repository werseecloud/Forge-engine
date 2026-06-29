import { useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { PathInput } from "../components/PathInput";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import type { PathValidation } from "../types/installer";
import { Screen } from "./WelcomeScreen";

export function ProjectFolderScreen() {
  const { projectFolder, installPath, set } = useInstallerStore();
  const [validation, setValidation] = useState<PathValidation | null>(null);
  useEffect(() => { if (projectFolder && installPath) installerApi.validateProjectFolder(projectFolder, installPath).then(setValidation); }, [projectFolder, installPath]);
  return <Screen title="Project Folder">
    <p>Choose where Forge Engine should store your projects.</p>
    <label>Default project folder<PathInput value={projectFolder} onChange={(path) => set({ projectFolder: path })} /></label>
    <p>{validation?.message}</p>{validation?.warning ? <div className="warning">{validation.warning}</div> : null}
    <footer><SecondaryButton onClick={() => set({ step: 3 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton disabled={!validation?.valid} onClick={() => set({ step: 5 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

