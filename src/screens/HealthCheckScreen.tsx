import { HealthCheckList } from "../components/HealthCheckList";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function HealthCheckScreen() {
  const store = useInstallerStore();
  const failed = store.healthChecks.some((h) => h.status === "failed");
  return <Screen title="Component Health Check">
    <p>Forge Engine is verifying installed components.</p>
    <HealthCheckList />
    {failed ? <div className="error-banner">One or more required components failed.</div> : <div className="success-line">✓ All required components passed.</div>}
    <footer><SecondaryButton onClick={async () => store.set({ healthChecks: await installerApi.runHealthChecks(store.config()) })}>Run Again</SecondaryButton><SecondaryButton>Repair</SecondaryButton><PrimaryButton disabled={failed} onClick={() => store.set({ step: 10 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

