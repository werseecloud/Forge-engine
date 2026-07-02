import { Activity, BadgeCheck, FileArchive, Footprints, Import, Play, RefreshCw, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { commands } from "../../lib/tauri";
import { formatBytes } from "../../lib/formatBytes";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { AnimationDatabase, CharacterImportResult, HumanoidDetectionResult } from "../../types/character";

const defaultCharacterPath = "C:\\Users\\Raeve\\Downloads\\rigged_character.glb";
const defaultAnimationPacks = [
  "C:\\Users\\Raeve\\Downloads\\Universal Animation Library[Standard].zip",
  "C:\\Users\\Raeve\\Downloads\\Animations_V1_01.zip",
  "C:\\Users\\Raeve\\Downloads\\Universal Animation Library 2[Standard].zip"
];

interface CharacterAnimationPanelProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function CharacterAnimationPanel({ onError, onSuccess }: CharacterAnimationPanelProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const [characterPath, setCharacterPath] = useState(defaultCharacterPath);
  const [packPaths, setPackPaths] = useState(defaultAnimationPacks.join("\n"));
  const [humanoid, setHumanoid] = useState<HumanoidDetectionResult | null>(null);
  const [database, setDatabase] = useState<AnimationDatabase | null>(null);
  const [result, setResult] = useState<CharacterImportResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const parsedPacks = useMemo(
    () => packPaths.split(/\r?\n/).map((path) => path.trim()).filter(Boolean),
    [packPaths]
  );
  const locomotionSummary = useMemo(() => {
    if (!database) return [];
    return Object.entries(database.locomotionSets).sort(([left], [right]) => left.localeCompare(right));
  }, [database]);

  useEffect(() => {
    let cancelled = false;
    commands.discoverDefaultCharacterAssets().then((assets) => {
      if (cancelled) return;
      if (assets.characterModelPath) setCharacterPath(assets.characterModelPath);
      if (assets.animationPackPaths.length) setPackPaths(assets.animationPackPaths.join("\n"));
    }).catch(() => {
      // The panel still works with manual paths when default content is not installed.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseCharacter = async () => {
    const files = await commands.chooseFiles();
    if (files[0]) setCharacterPath(files[0]);
  };

  const choosePacks = async () => {
    const files = await commands.chooseFiles();
    if (files.length) setPackPaths(files.join("\n"));
  };

  const detect = async () => {
    setBusy("detect");
    try {
      const detected = await commands.detectHumanoid(characterPath);
      setHumanoid(detected);
      detected.isHumanoid
        ? onSuccess(`Humanoid rig detected at ${Math.round(detected.confidence * 100)}% confidence.`)
        : onError(`Humanoid rig is incomplete. Missing: ${detected.missingBones.join(", ") || "unknown"}`);
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(null);
    }
  };

  const indexPacks = async () => {
    setBusy("index");
    try {
      const indexed = await commands.indexAnimationPacks(parsedPacks);
      setDatabase(indexed);
      onSuccess(`Indexed ${indexed.clips.length} animation clips from ${indexed.packs.length} pack(s).`);
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(null);
    }
  };

  const importCharacter = async () => {
    if (!currentProject) {
      onError("Open a project before importing a character.");
      return;
    }
    setBusy("import");
    try {
      const imported = await commands.importCharacter({
        projectRoot: currentProject.rootPath,
        characterSourcePath: characterPath,
        animationPackPaths: parsedPacks,
        characterName: null,
        placeInLevelPath: activeLevel?.path ?? null
      });
      setResult(imported);
      setHumanoid(imported.humanoid);
      setDatabase(imported.animationDatabase);
      if (activeLevel) {
        const refreshed = await commands.openLevel(currentProject.rootPath, activeLevel.path);
        setActiveLevel(refreshed);
      }
      if (imported.warnings.length) onError(imported.warnings.join("\n"));
      else onSuccess(`Imported ${imported.character.name} and indexed ${imported.animationDatabase.clips.length} clips.`);
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="character-panel">
      <div className="character-panel__left">
        <div className="panel-title-row">
          <div>
            <h3>Character Animation</h3>
            <span>Import a GLB, build a Forge Auto-Rig, index animation packs, and place a controllable player in the level.</span>
          </div>
          <button className="pill-button" disabled={busy !== null} onClick={importCharacter}>
            <Import size={15} /> Import + Place
          </button>
        </div>

        <label className="character-field">
          <span>Character GLB</span>
          <div>
            <input value={characterPath} onChange={(event) => setCharacterPath(event.target.value)} />
            <button className="secondary-button" onClick={chooseCharacter}>Browse</button>
          </div>
        </label>

        <label className="character-field">
          <span>Animation pack zips</span>
          <textarea value={packPaths} onChange={(event) => setPackPaths(event.target.value)} spellCheck={false} />
          <button className="secondary-button character-field__browse" onClick={choosePacks}>Choose packs</button>
        </label>

        <div className="character-actions">
          <button className="secondary-button" disabled={busy !== null} onClick={detect}>
            <UserRound size={15} /> Detect Humanoid
          </button>
          <button className="secondary-button" disabled={busy !== null} onClick={indexPacks}>
            <FileArchive size={15} /> Index Packs
          </button>
          <button className="secondary-button" disabled={!result || busy !== null} onClick={() => result && commands.revealInExplorer(result.character.projectCharacterPath)}>
            <RefreshCw size={15} /> Reveal Output
          </button>
        </div>
      </div>

      <div className="character-panel__right">
        <MetricCard icon={<BadgeCheck size={17} />} title="Humanoid">
          {humanoid ? (
            <>
              <strong>{humanoid.isHumanoid ? "Detected" : "Incomplete"} ({Math.round(humanoid.confidence * 100)}%)</strong>
              <span>{humanoid.skeletonBoneCount} named nodes, {humanoid.meshCount} mesh(es), {humanoid.animationCount} embedded clip(s)</span>
              {humanoid.missingBones.length ? <em>Missing: {humanoid.missingBones.join(", ")}</em> : null}
            </>
          ) : <span>Run detection to inspect the GLB skeleton.</span>}
        </MetricCard>

        <MetricCard icon={<Activity size={17} />} title="Animation Database">
          {database ? (
            <>
              <strong>{database.clips.length} clips</strong>
              <span>{database.packs.map((pack) => `${pack.displayName}: ${pack.clipCount} (${formatBytes(pack.sizeBytes)})`).join(" | ")}</span>
              <div className="tag-cloud">
                {locomotionSummary.slice(0, 12).map(([tag, ids]) => <span key={tag}>{tag} {ids.length}</span>)}
              </div>
            </>
          ) : <span>Index packs to classify idle, walk, run, sprint, jump, fall, land, crouch, turn and lean clips.</span>}
        </MetricCard>

        <MetricCard icon={<Footprints size={17} />} title="Runtime Controller">
          {result ? (
            <>
              <strong>{result.character.controller.states.length} locomotion states</strong>
              <span>WASD, sprint, jump, crouch, retarget profile and foot IK settings were written to disk.</span>
              <span>{result.placedObjectId ? `Placed entity ${result.placedObjectId}` : "No active level was open, so no entity was placed."}</span>
            </>
          ) : <span>Import writes a real player controller and animation state machine component.</span>}
        </MetricCard>

        <MetricCard icon={<Play size={17} />} title="Generated Files">
          {result ? (
            <div className="generated-file-list">
              {result.generatedFiles.map((file) => <code key={file}>{file}</code>)}
            </div>
          ) : <span>No generated files yet.</span>}
        </MetricCard>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="character-metric">
      <header>{icon}<span>{title}</span></header>
      <div>{children}</div>
    </section>
  );
}
