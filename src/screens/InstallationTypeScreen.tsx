import { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function InstallationTypeScreen() {
  const { installPath, installMode, existingInstall, set } = useInstallerStore();
  useEffect(() => { installerApi.checkExistingInstall(installPath).then((existing) => set({ existingInstall: existing })).catch(() => undefined); }, [installPath]);
  const modes = existingInstall?.found ? [
    ["update", "Update Forge Engine", "Update to the latest version while keeping projects and caches."],
    ["repair", "Repair Installation", "Fix missing files, broken settings, and worker issues."],
    ["uninstall", "Uninstall Forge Engine", "Remove Forge Engine from this PC."]
  ] : [
    ["recommended", "Recommended Installation", "Installs Forge Engine with the default editor, runtime, workers, templates, project tools, and local folders."],
    ["custom", "Custom Installation", "Choose which components and locations you want to install."]
  ];
  return <Screen title={existingInstall?.found ? "Existing Installation Found" : "Installation Type"}>
    <p>{existingInstall?.found ? `Installed version: Forge Engine ${existingInstall.installedVersion ?? "Unknown"}` : "Choose how you want to install Forge Engine."}</p>
    <div className="choice-list">{modes.map(([id, title, detail]) => <button key={id} className={installMode === id ? "choice active" : "choice"} onClick={() => set({ installMode: id })}><span /> <b>{title}</b><small>{detail}</small></button>)}</div>
    <footer><SecondaryButton onClick={() => set({ step: 1 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton onClick={() => set({ step: 3 })}>{existingInstall?.found && installMode === "update" ? "Update Forge Engine" : "Continue"}</PrimaryButton></footer>
  </Screen>;
}

