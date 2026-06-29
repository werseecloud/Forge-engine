import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { installerApi } from "../lib/installerTauri";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function CompleteScreen() {
  const store = useInstallerStore();
  const failed = store.result && !store.result.success;
  return <Screen title={failed ? "Installation Needs Attention" : "Forge Engine Installed"}>
    <p>{failed ? "Forge Engine installation finished with errors." : "Forge Engine has been installed successfully."}</p>
    <div className="complete-logo"><div className="forge-logo">F</div><strong>FORGE</strong><span>ENGINE</span></div>
    <p>Installed version:<br />Forge Engine 1.0.0</p>
    {store.errors.length ? <div className="error-banner">{store.errors.map((e) => <div key={e}>{e}</div>)}</div> : null}
    <label><input type="checkbox" defaultChecked /> Launch Forge Engine now</label>
    <label><input type="checkbox" /> Open project folder</label>
    <label><input type="checkbox" /> View release notes</label>
    <footer><SecondaryButton onClick={() => window.close()}>Close</SecondaryButton><PrimaryButton disabled={!!failed} onClick={() => installerApi.openFolder(store.installPath)}>Launch Forge Engine</PrimaryButton></footer>
  </Screen>;
}

