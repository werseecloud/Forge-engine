import { useEffect } from "react";
import { ComponentList } from "../components/ComponentList";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { formatBytes } from "../lib/formatBytes";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function ComponentsScreen() {
  const { installPath, components, set } = useInstallerStore();
  useEffect(() => { installerApi.scanAvailableComponents(installPath).then((components) => set({ components })); }, [installPath]);
  const blocked = components.some((c) => c.required && !c.available);
  const total = components.filter((c) => c.selected).reduce((sum, c) => sum + c.sizeBytes, 0);
  return <Screen title="Components">
    <p>Forge Engine will install the following real components found on disk.</p>
    <ComponentList />
    <p>Required disk space: {formatBytes(total)}</p>
    {blocked ? <div className="error-banner">A required component binary is missing. Build components before installing.</div> : null}
    <footer><SecondaryButton onClick={() => set({ step: 4 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton disabled={blocked} onClick={() => set({ step: 6 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

