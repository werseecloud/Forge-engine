import { useEffect } from "react";
import { CheckResultRow } from "../components/CheckResultRow";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function SystemCheckScreen() {
  const { installPath, projectFolder, systemChecks, set } = useInstallerStore();
  async function run() {
    const checks = await installerApi.runSystemCheck(installPath, projectFolder);
    set({ systemChecks: checks });
  }
  useEffect(() => { void run(); }, []);
  const blocked = systemChecks.some((check) => check.blocking && check.status === "failed");
  return <Screen title="System Check">
    <p>Forge Engine is checking your system before installation.</p>
    <div className="result-box">{systemChecks.map((check) => <CheckResultRow key={check.id} check={check} />)}</div>
    <footer><SecondaryButton onClick={() => set({ step: 0 })}>Back</SecondaryButton><SecondaryButton onClick={run}>Run Check Again</SecondaryButton><PrimaryButton disabled={blocked} onClick={() => set({ step: 2 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

