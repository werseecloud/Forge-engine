import { useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { PathInput } from "../components/PathInput";
import { formatBytes } from "../lib/formatBytes";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import type { PathValidation } from "../types/installer";
import { Screen } from "./WelcomeScreen";

export function InstallLocationScreen() {
  const { installPath, set } = useInstallerStore();
  const [validation, setValidation] = useState<PathValidation | null>(null);
  useEffect(() => { if (installPath) installerApi.validateInstallPath(installPath).then(setValidation); }, [installPath]);
  return <Screen title="Install Location">
    <p>Choose where Forge Engine should be installed.</p>
    <label>Install path<PathInput value={installPath} onChange={(path) => set({ installPath: path })} /></label>
    <p>{validation?.message}</p>{validation?.warning ? <div className="warning">{validation.warning}</div> : null}
    <p>Available space: {formatBytes(validation?.availableSpace ?? 0)}</p>
    <footer><SecondaryButton onClick={() => set({ step: 2 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton disabled={!validation?.valid} onClick={() => set({ step: 4 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

