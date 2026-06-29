import { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { formatBytes } from "../lib/formatBytes";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function ReadyToInstallScreen() {
  const store = useInstallerStore();
  useEffect(() => { installerApi.createInstallPlan(store.config()).then((plan) => store.set({ plan })).catch((error) => store.set({ errors: [String(error)] })); }, [store.installPath, store.projectFolder, store.components]);
  return <Screen title="Ready to Install">
    <p>Forge Engine is ready to be installed.</p>
    <pre className="preview-box">{`Install path:
  ${store.installPath}

Project folder:
  ${store.projectFolder}

Components:
${store.components.filter((c) => c.selected).map((c) => `  • ${c.displayName}`).join("\n")}

Total disk usage:
  ${formatBytes(store.plan?.totalSizeBytes ?? 0)}

Mode:
  ${store.installMode}`}</pre>
    <footer><SecondaryButton onClick={() => store.set({ step: 6 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton onClick={() => store.set({ step: 8 })}>Install Forge Engine</PrimaryButton></footer>
  </Screen>;
}

