import { useEffect } from "react";
import { AppShell } from "./components/shell/AppShell";
import { InstallerShell } from "./components/InstallerShell";
import { installerApi } from "./lib/installerTauri";
import { useInstallerStore } from "./stores/useInstallerStore";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { SystemCheckScreen } from "./screens/SystemCheckScreen";
import { InstallationTypeScreen } from "./screens/InstallationTypeScreen";
import { InstallLocationScreen } from "./screens/InstallLocationScreen";
import { ProjectFolderScreen } from "./screens/ProjectFolderScreen";
import { ComponentsScreen } from "./screens/ComponentsScreen";
import { FolderPreviewScreen } from "./screens/FolderPreviewScreen";
import { ReadyToInstallScreen } from "./screens/ReadyToInstallScreen";
import { InstallingScreen } from "./screens/InstallingScreen";
import { HealthCheckScreen } from "./screens/HealthCheckScreen";
import { CompleteScreen } from "./screens/CompleteScreen";

export default function App() {
  if (import.meta.env.VITE_FORGE_APP === "editor") {
    return <AppShell />;
  }

  const { step, set } = useInstallerStore();

  useEffect(() => {
    installerApi.getWindowsUserPaths().then(async (paths) => {
      const existing = await installerApi.checkExistingInstall(paths.installDefault);
      const components = await installerApi.scanAvailableComponents(paths.installDefault);
      set({
        userPaths: paths,
        installPath: paths.installDefault,
        projectFolder: paths.projectsDir,
        existingInstall: existing,
        components
      });
    }).catch((error) => set({ errors: [String(error)] }));
  }, [set]);

  return (
    <InstallerShell>
      {step === 0 ? <WelcomeScreen /> : null}
      {step === 1 ? <SystemCheckScreen /> : null}
      {step === 2 ? <InstallationTypeScreen /> : null}
      {step === 3 ? <InstallLocationScreen /> : null}
      {step === 4 ? <ProjectFolderScreen /> : null}
      {step === 5 ? <ComponentsScreen /> : null}
      {step === 6 ? <FolderPreviewScreen /> : null}
      {step === 7 ? <ReadyToInstallScreen /> : null}
      {step === 8 ? <InstallingScreen /> : null}
      {step === 9 ? <HealthCheckScreen /> : null}
      {step === 10 ? <CompleteScreen /> : null}
    </InstallerShell>
  );
}
