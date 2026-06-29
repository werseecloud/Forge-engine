import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { EnvironmentPreview } from "../components/EnvironmentPreview";
import { useInstallerStore } from "../stores/useInstallerStore";

export function WelcomeScreen() {
  const set = useInstallerStore((s) => s.set);
  return <Screen title="Welcome to Forge Engine.">
    <p>Forge Engine will install the editor, runtime, renderer worker, shader worker, asset worker, and build worker on your PC.</p>
    <p>Before continuing, close any running Forge Engine apps.</p>
    <EnvironmentPreview />
    <footer><SecondaryButton onClick={() => window.close()}>Cancel</SecondaryButton><PrimaryButton onClick={() => set({ step: 1 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

export function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="wizard-screen"><h1>{title}</h1>{children}</section>;
}
