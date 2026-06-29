import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useAssetStore } from "../../stores/useAssetStore";
import { useLogStore } from "../../stores/useLogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { OpenProjectResponse } from "../../types/project";
import type { SceneLevel } from "../../types/scene";
import type { WatcherStatus } from "../../types/fs";
import type { ToastMessage } from "../shared/ToastCenter";
import { ToastCenter } from "../shared/ToastCenter";
import { BottomDrawer } from "../docks/BottomDrawer";
import { LeftDock } from "../docks/LeftDock";
import { RightDock } from "../docks/RightDock";
import { CenterViewport } from "../viewport/CenterViewport";
import { CreateLevelModal } from "../modals/CreateLevelModal";
import { CreateProjectModal } from "../modals/CreateProjectModal";
import { SettingsModal } from "../modals/SettingsModal";
import { StatusBar } from "./StatusBar";
import { TopToolbar } from "./TopToolbar";
import { WindowsTitleBar } from "./WindowsTitleBar";

export function AppShell() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createLevelOpen, setCreateLevelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [watcher, setWatcher] = useState<WatcherStatus | null>(null);
  const [fps, setFps] = useState(0);
  const [lastImportStatus, setLastImportStatus] = useState("");

  const setAppReady = useAppStore((state) => state.setAppReady);
  const selectAsset = useAppStore((state) => state.selectAsset);
  const selectEntity = useAppStore((state) => state.selectEntity);
  const currentProject = useProjectStore((state) => state.currentProject);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const setRecentProjects = useProjectStore((state) => state.setRecentProjects);
  const setPinnedProjects = useProjectStore((state) => state.setPinnedProjects);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const settings = useSettingsStore((state) => state.settings);
  const defaultProjectsDir = useSettingsStore((state) => state.defaultProjectsDir);
  const setAssetIndex = useAssetStore((state) => state.setAssetIndex);
  const setFolderTree = useAssetStore((state) => state.setFolderTree);
  const setLevels = useSceneStore((state) => state.setLevels);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const setOutputLogs = useLogStore((state) => state.setOutputLogs);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      await commands.ensureAppDirectories();
      const loadedSettings = await commands.getSettings();
      setSettings(loadedSettings);
      setPinnedProjects(loadedSettings.pinnedProjects);
      setRecentProjects(await commands.listRecentProjects());
      setOutputLogs(await commands.readOutputLog());
      if (loadedSettings.lastOpenedProject) {
        try {
          await hydrateProject(await commands.openProject(loadedSettings.lastOpenedProject));
        } catch {
          setCurrentProject(null);
        }
      }
      setAppReady(true);
    } catch (error) {
      toast("error", String(error));
    }
  }

  async function hydrateProject(response: OpenProjectResponse) {
    setCurrentProject(response.manifest);
    setAssetIndex(response.assetIndex);
    setLevels(response.levels);
    selectAsset(null);
    selectEntity(null);
    const contentRoot = `${response.manifest.rootPath}\\Content`;
    try {
      setFolderTree(await commands.readDirectoryTree(contentRoot));
    } catch {
      setFolderTree(null);
    }
    const watched = await commands.watchProjectDirectory(response.manifest.rootPath);
    setWatcher(watched);

    const preferred = response.manifest.defaultScene ?? response.levels[0]?.relativePath;
    if (preferred) {
      const level = await commands.openLevel(response.manifest.rootPath, preferred);
      setActiveLevel(level);
    } else {
      setActiveLevel(null);
    }
    setRecentProjects(await commands.listRecentProjects());
  }

  async function refreshProjectData() {
    if (!currentProject) return;
    const [assets, levels, tree, logs] = await Promise.all([
      commands.scanAssets(currentProject.rootPath),
      commands.listLevels(currentProject.rootPath),
      commands.readDirectoryTree(`${currentProject.rootPath}\\Content`),
      commands.readOutputLog()
    ]);
    setAssetIndex(assets);
    setLevels(levels);
    setFolderTree(tree);
    setOutputLogs(logs);
  }

  async function openProject() {
    try {
      const path = await commands.chooseDirectory();
      if (!path) return;
      await hydrateProject(await commands.openProject(path));
      toast("success", "Project opened.");
    } catch (error) {
      toast("error", String(error));
    }
  }

  async function saveActiveLevel() {
    if (!currentProject || !activeLevel) return;
    try {
      const saved = await commands.saveLevel(currentProject.rootPath, activeLevel);
      setActiveLevel(saved);
      toast("success", "Level saved.");
    } catch (error) {
      toast("error", String(error));
    }
  }

  function toast(tone: ToastMessage["tone"], message: string) {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, tone, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3600);
  }

  async function onLevelCreated(level: SceneLevel) {
    setActiveLevel(level);
    await refreshProjectData();
    toast("success", "Level created.");
  }

  const projectRoot = currentProject?.rootPath ?? null;

  return (
    <motion.div className="app-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <WindowsTitleBar />
      <TopToolbar onCreateProject={() => setCreateProjectOpen(true)} onOpenProject={openProject} onSettings={() => setSettingsOpen(true)} onSave={saveActiveLevel} />
      <main className="editor-grid">
        <LeftDock onCreateLevel={() => setCreateLevelOpen(true)} />
        <div className="center-stack">
          <CenterViewport fps={fps} setFps={setFps} onCreateProject={() => setCreateProjectOpen(true)} onOpenProject={openProject} onCreateLevel={() => setCreateLevelOpen(true)} onError={(message) => toast("error", message)} />
          <BottomDrawer
            onImportStatus={setLastImportStatus}
            onError={(message) => toast("error", message)}
            onSuccess={(message) => toast("success", message)}
            onRefresh={refreshProjectData}
          />
        </div>
        <RightDock onError={(message) => toast("error", message)} />
      </main>
      <StatusBar fps={fps} watcher={watcher} lastImportStatus={lastImportStatus} />

      <CreateProjectModal
        open={createProjectOpen}
        defaultLocation={defaultProjectsDir}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={(response) => {
          void hydrateProject(response);
          toast("success", "Project created.");
        }}
        onError={(message) => toast("error", message)}
      />
      <CreateLevelModal
        open={createLevelOpen}
        projectRoot={projectRoot}
        onClose={() => setCreateLevelOpen(false)}
        onCreated={onLevelCreated}
        onError={(message) => toast("error", message)}
      />
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSaved={(saved) => {
          setSettings(saved);
          toast("success", "Settings saved.");
        }}
        onError={(message) => toast("error", message)}
      />
      <AnimatePresence>
        <ToastCenter toasts={toasts} />
      </AnimatePresence>
    </motion.div>
  );
}
