import { PrimaryButton, SecondaryButton } from "../components/InstallerButtons";
import { useInstallerStore } from "../stores/useInstallerStore";
import { Screen } from "./WelcomeScreen";

export function FolderPreviewScreen() {
  const { installPath, projectFolder, userPaths, set } = useInstallerStore();
  return <Screen title="Folder Preview">
    <p>Forge Engine will create the following folders on this PC.</p>
    <pre className="preview-box">{`Application files
  ${installPath}
    bin
    engine\\Config
    engine\\Templates
    engine\\StarterContent
    engine\\Shaders
    engine\\Runtime
    engine\\Plugins
    engine\\Tools
    docs
    licenses

User documents
  ${userPaths?.documentsRoot}
    Projects: ${projectFolder}
    Templates
    Backups
    Exports

Local app data
  ${userPaths?.localRoot}
    Cache
    ShaderCache
    AssetCache
    BuildCache
    Logs
    Temp
    CrashReports
    WorkerLogs

Roaming settings
  ${userPaths?.roamingRoot}`}</pre>
    <footer><SecondaryButton onClick={() => set({ step: 5 })}>Back</SecondaryButton><SecondaryButton>Cancel</SecondaryButton><PrimaryButton onClick={() => set({ step: 7 })}>Continue</PrimaryButton></footer>
  </Screen>;
}

