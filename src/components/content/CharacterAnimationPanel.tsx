import { Activity, BadgeCheck, FileArchive, Footprints, Import, ListTree, Play, RefreshCw, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { commands } from "../../lib/tauri";
import { formatBytes } from "../../lib/formatBytes";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type {
  AnimationDatabase,
  AnimationSelectionResult,
  CharacterImportResult,
  GeneratedAnimationStateMachine,
  HumanoidDetectionResult
} from "../../types/character";

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
  const [selectionResult, setSelectionResult] = useState<AnimationSelectionResult | null>(null);
  const [stateMachine, setStateMachine] = useState<GeneratedAnimationStateMachine | null>(null);
  const [debugSpeed, setDebugSpeed] = useState(0);
  const [debugSide, setDebugSide] = useState(0);
  const [debugSprinting, setDebugSprinting] = useState(false);
  const [debugCrouching, setDebugCrouching] = useState(false);
  const [debugJumping, setDebugJumping] = useState(false);
  const [debugGrounded, setDebugGrounded] = useState(true);
  const [lastSelectedState, setLastSelectedState] = useState<string | null>(null);
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

  const runProceduralSelection = async () => {
    const databasePath = result?.character.animationDatabasePath;
    if (!databasePath) {
      onError("Import a character first so Forge has an animation_database.json path.");
      return;
    }
    setBusy("select");
    try {
      const selected = await commands.selectProceduralAnimation({
        animationDatabasePath: databasePath,
        velocity: { x: debugSide, y: debugJumping ? 3.2 : 0, z: -debugSpeed },
        acceleration: { x: debugSide * 0.8, y: 0, z: -debugSpeed * 0.8 },
        grounded: debugGrounded,
        jumpPressed: debugJumping,
        crouching: debugCrouching,
        sprinting: debugSprinting,
        cameraForward: { x: 0, y: 0, z: -1 },
        lastState: lastSelectedState
      });
      setSelectionResult(selected);
      setLastSelectedState(selected.selectedState);
      selected.warnings.length ? onError(selected.warnings.join("\n")) : onSuccess(`Selected ${selected.selectedState}.`);
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(null);
    }
  };

  const generateStateMachine = async () => {
    const databasePath = result?.character.animationDatabasePath;
    if (!databasePath) {
      onError("Import a character first so Forge can read animation_database.json.");
      return;
    }
    setBusy("state-machine");
    try {
      const generated = await commands.generateAnimationStateMachine(databasePath);
      setStateMachine(generated);
      generated.missingStates.length
        ? onError(`State machine generated with missing clips: ${generated.missingStates.join(", ")}`)
        : onSuccess(`Generated ${generated.states.length} animation states and ${generated.transitions.length} transitions.`);
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

        <section className="character-debug">
          <header>
            <strong>Procedural Animation Debug</strong>
            <span>Feeds real intent values into the backend selector.</span>
          </header>
          <label>
            <span>Forward speed</span>
            <input type="range" min={0} max={8} step={0.1} value={debugSpeed} onChange={(event) => setDebugSpeed(Number(event.target.value))} />
            <strong>{debugSpeed.toFixed(1)} m/s</strong>
          </label>
          <label>
            <span>Side input</span>
            <input type="range" min={-6} max={6} step={0.1} value={debugSide} onChange={(event) => setDebugSide(Number(event.target.value))} />
            <strong>{debugSide.toFixed(1)}</strong>
          </label>
          <div className="character-debug__toggles">
            <TogglePill label="Sprint" checked={debugSprinting} onChange={setDebugSprinting} />
            <TogglePill label="Crouch" checked={debugCrouching} onChange={setDebugCrouching} />
            <TogglePill label="Jump" checked={debugJumping} onChange={setDebugJumping} />
            <TogglePill label="Grounded" checked={debugGrounded} onChange={setDebugGrounded} />
          </div>
          <div className="character-actions">
            <button className="secondary-button" disabled={!result || busy !== null} onClick={runProceduralSelection}>
              <Activity size={15} /> Select Best Clip
            </button>
            <button className="secondary-button" disabled={!result || busy !== null} onClick={generateStateMachine}>
              <ListTree size={15} /> Generate State Machine
            </button>
          </div>
        </section>
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

        <MetricCard icon={<Activity size={17} />} title="Procedural Selection">
          {selectionResult ? (
            <>
              <strong>{selectionResult.selectedState} ({selectionResult.direction})</strong>
              <span>Speed {selectionResult.speed.toFixed(2)} m/s, blend {selectionResult.blendSeconds.toFixed(2)}s</span>
              <span>{selectionResult.selectedClip ? selectionResult.selectedClip.name : "No clip selected"}</span>
              <div className="generated-file-list">
                {selectionResult.reasons.map((reason) => <code key={reason}>{reason}</code>)}
              </div>
            </>
          ) : <span>Run Select Best Clip to test backend animation choice.</span>}
        </MetricCard>

        <MetricCard icon={<ListTree size={17} />} title="Generated State Machine">
          {stateMachine ? (
            <>
              <strong>{stateMachine.states.length} states, {stateMachine.transitions.length} transitions</strong>
              {stateMachine.missingStates.length ? <em>Missing clips: {stateMachine.missingStates.join(", ")}</em> : <span>All required locomotion states have clips.</span>}
              <div className="tag-cloud">
                {stateMachine.states.map((state) => <span key={state.state}>{state.state} {state.clipIds.length}</span>)}
              </div>
            </>
          ) : <span>Generate a state machine from the indexed animation tags.</span>}
        </MetricCard>
      </div>
    </div>
  );
}

function TogglePill({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button className={checked ? "toggle-pill is-active" : "toggle-pill"} onClick={() => onChange(!checked)} type="button">
      {label}
    </button>
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
