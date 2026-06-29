import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { ProgressBar } from "../components/ProgressBar";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function InstallingScreen() {
  const store = useInstallerStore();
  const steps = store.plan?.steps ?? ["Validate paths", "Create application folders", "Copy Forge Engine files", "Create user folders", "Write manifest", "Write settings", "Create shortcuts", "Register file associations", "Run health checks", "Finalize"];
  const done = Object.values(store.installingSteps).filter((s) => s === "done").length;
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    listen<{ step: string }>("install_step_started", (event) => store.set({ progressText: event.payload.step, installingSteps: { ...store.installingSteps, [event.payload.step]: "running" } })).then((u) => unsubs.push(u));
    listen<{ step: string }>("install_step_completed", (event) => store.set({ progressText: event.payload.step, installingSteps: { ...useInstallerStore.getState().installingSteps, [event.payload.step]: "done" } })).then((u) => unsubs.push(u));
    listen<{ step: string }>("install_step_failed", (event) => store.set({ progressText: event.payload.step, installingSteps: { ...useInstallerStore.getState().installingSteps, [event.payload.step]: "failed" } })).then((u) => unsubs.push(u));
    listen<string>("installer_log_line", (event) => store.set({ logs: [...useInstallerStore.getState().logs, event.payload] })).then((u) => unsubs.push(u));
    installerApi.runInstallPlan(store.config()).then((result) => store.set({ result, healthChecks: result.healthChecks, errors: result.errors, step: 9 })).catch((error) => store.set({ errors: [String(error)], step: 9 }));
    return () => unsubs.forEach((u) => u());
  }, []);
  return <Screen title="Installing Forge Engine">
    <p>Please wait while Forge Engine is installed.</p>
    <div className="progress-row"><b>Current step:</b><span>{store.progressText || "Starting..."}</span><em>{Math.round((done / steps.length) * 100)}%</em></div>
    <ProgressBar value={(done / steps.length) * 100} />
    <div className="install-steps">{steps.map((step) => <div key={step} className={store.installingSteps[step] ?? "pending"}><span />{step}</div>)}</div>
    <footer><SecondaryButton>Cancel</SecondaryButton></footer>
  </Screen>;
}
