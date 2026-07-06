import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeSkyboxSettings, type SkyboxResolution } from "../../lib/skybox";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { SceneObject } from "../../types/scene";
import { CustomSelect } from "../shared/CustomSelect";
import { PillButton } from "../shared/PillButton";
import { InspectorSection } from "./InspectorSection";
import { TransformEditor } from "./TransformEditor";

interface SceneObjectInspectorProps {
  object: SceneObject;
  onError: (message: string) => void;
}

export function SceneObjectInspector({ object, onError }: SceneObjectInspectorProps) {
  const [draft, setDraft] = useState(object);
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const setActiveLevel = useSceneStore((state) => state.setActiveLevel);
  const setSelectedSceneObject = useSceneStore((state) => state.setSelectedSceneObject);
  const selectEntity = useAppStore((state) => state.selectEntity);

  useEffect(() => setDraft(object), [object]);
  const skyboxComponent = draft.components.find((component) => component.componentType === "Skybox");
  const skyboxSettings = skyboxComponent ? normalizeSkyboxSettings(skyboxComponent.data) : null;
  const characterController = draft.components.find((component) => component.componentType === "CharacterController");
  const skeletalMesh = draft.components.find((component) => component.componentType === "SkeletalMesh");
  const animationStateMachine = draft.components.find((component) => component.componentType === "AnimationStateMachine");
  const worldComponent = draft.components.find((component) => component.componentType === "WorldComponent");
  const terrainComponent = draft.components.find((component) => component.componentType === "TerrainComponent");
  const terrainMaterialComponent = draft.components.find((component) => component.componentType === "TerrainMaterialComponent");
  const worldScatterComponent = draft.components.find((component) => component.componentType === "WorldScatterComponent");
  const worldPerformanceComponent = draft.components.find((component) => component.componentType === "WorldPerformanceComponent");

  async function save() {
    if (!currentProject || !activeLevel) return;
    try {
      const saved = await commands.updateSceneObject(currentProject.rootPath, activeLevel.path, draft);
      setActiveLevel(saved);
      const updated = saved.objects.find((item) => item.id === draft.id) ?? draft;
      setSelectedSceneObject(updated);
      selectEntity(updated);
    } catch (error) {
      onError(String(error));
    }
  }

  async function remove() {
    if (!currentProject || !activeLevel) return;
    try {
      const saved = await commands.deleteSceneObject(currentProject.rootPath, activeLevel.path, draft.id);
      setActiveLevel(saved);
      setSelectedSceneObject(null);
      selectEntity(null);
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <strong>{draft.name}</strong>
        <span>Scene Object</span>
      </div>
      <InspectorSection title="Details">
        <div className="inspector-form-grid">
          <label className="field-stack span-2">
            <span>Name</span>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <ToggleField label="Visible" checked={draft.visible} onChange={(visible) => setDraft({ ...draft, visible })} />
          <label className="field-stack">
            <span>Layer</span>
            <input value={draft.layer ?? "None"} readOnly />
          </label>
          <label className="field-stack span-2">
            <span>Tags</span>
            <input value={draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
          </label>
        </div>
      </InspectorSection>
      {skyboxSettings ? (
        <InspectorSection title="Skybox">
          <SkyboxInspector
            settings={skyboxSettings}
            onChange={(nextSettings) => setDraft({
              ...draft,
              components: draft.components.map((component) => component.componentType === "Skybox" ? { ...component, data: nextSettings as unknown as Record<string, unknown> } : component)
            })}
          />
        </InspectorSection>
      ) : null}
      {characterController || skeletalMesh || animationStateMachine ? (
        <InspectorSection title="Character">
          <div className="detail-grid">
            {skeletalMesh ? (
              <>
                <span>Rig</span><strong>{String(skeletalMesh.data.rig ?? "None")}</strong>
                <span>Retarget</span><strong>{String(skeletalMesh.data.retargetProfile ?? "None")}</strong>
                <span>Humanoid</span><strong>{String(skeletalMesh.data.humanoid ?? false)}</strong>
              </>
            ) : null}
            {animationStateMachine ? (
              <>
                <span>Animation DB</span><strong>{String(animationStateMachine.data.database ?? "None")}</strong>
                <span>Clips</span><strong>{String(animationStateMachine.data.clipCount ?? 0)}</strong>
                <span>Foot IK</span><strong>{String(animationStateMachine.data.footIk ?? false)}</strong>
              </>
            ) : null}
            {characterController ? (
              <>
                <span>WASD</span><strong>{String(characterController.data.wasdEnabled ?? false)}</strong>
                <span>Sprint</span><strong>{String(characterController.data.sprintKey ?? "ShiftLeft")}</strong>
                <span>Jump</span><strong>{String(characterController.data.jumpKey ?? "Space")}</strong>
                <span>Crouch</span><strong>{String(characterController.data.crouchKey ?? "ControlLeft")}</strong>
              </>
            ) : null}
          </div>
        </InspectorSection>
      ) : null}
      {worldComponent ? (
        <InspectorSection title="World">
          <div className="detail-grid">
            <span>Name</span><strong>{String(worldComponent.data.name ?? draft.name)}</strong>
            <span>Seed</span><strong>{String(worldComponent.data.seed ?? "None")}</strong>
            <span>Map Size</span><strong>{String(worldComponent.data.mapSize ?? "Unknown")}m</strong>
            <span>World File</span><strong>{String(worldComponent.data.worldFile ?? "None")}</strong>
            {terrainComponent ? (
              <>
                <span>Resolution</span><strong>{String(terrainComponent.data.resolution ?? "Unknown")}</strong>
                <span>Max Height</span><strong>{String(terrainComponent.data.maxHeight ?? "Unknown")}</strong>
                <span>Mountain Height</span><strong>{String(terrainComponent.data.mountainHeight ?? "Unknown")}</strong>
                <span>Chunks</span><strong>{String(terrainComponent.data.chunkCount ?? "Unknown")}</strong>
              </>
            ) : null}
            {terrainMaterialComponent ? (
              <>
                <span>Material Preset</span><strong>{String(terrainMaterialComponent.data.preset ?? "Fallback")}</strong>
                <span>PBR</span><strong>{String(terrainMaterialComponent.data.usePbr ?? false)}</strong>
              </>
            ) : null}
            {worldPerformanceComponent ? (
              <>
                <span>Texture Quality</span><strong>{String(worldPerformanceComponent.data.textureQuality ?? "Auto")}</strong>
                <span>Terrain LOD</span><strong>{String(worldPerformanceComponent.data.terrainLod ?? "Auto")}</strong>
                <span>Streaming</span><strong>{String(worldPerformanceComponent.data.streaming ?? false)}</strong>
              </>
            ) : null}
            {worldScatterComponent ? (
              <>
                <span>Scatter</span><strong>{Array.isArray(worldScatterComponent.data.layers) ? `${worldScatterComponent.data.layers.length} layers` : "None"}</strong>
              </>
            ) : null}
          </div>
        </InspectorSection>
      ) : null}
      {draft.transform ? (
        <InspectorSection title="Transform">
          <TransformEditor value={draft.transform} onChange={(transform) => setDraft({ ...draft, transform })} />
        </InspectorSection>
      ) : null}
      {draft.assetReference ? (
        <InspectorSection title="Asset Reference">
          <div className="detail-grid">
            <span>Asset</span><strong>{draft.assetReference}</strong>
          </div>
        </InspectorSection>
      ) : null}
      <div className="inspector-actions">
        <PillButton active onClick={save} icon={<Save size={15} />}>Save</PillButton>
        <PillButton onClick={remove} icon={<Trash2 size={15} />}>Delete</PillButton>
      </div>
    </div>
  );
}

function SkyboxInspector({ settings, onChange }: { settings: ReturnType<typeof normalizeSkyboxSettings>; onChange: (settings: ReturnType<typeof normalizeSkyboxSettings>) => void }) {
  const resolutions: SkyboxResolution[] = ["Auto", "2k", "4k", "8k", "16k"];
  return (
    <div className="inspector-form-grid">
      <ToggleField label="Enabled" checked={settings.enabled} onChange={(enabled) => onChange({ ...settings, enabled })} />
      <ToggleField label="Show background" checked={settings.showAsBackground} onChange={(showAsBackground) => onChange({ ...settings, showAsBackground })} />
      <CustomSelect label="Resolution" value={settings.resolution} options={resolutions} onChange={(resolution) => onChange({ ...settings, resolution })} />
      <label className="field-stack">
        <span>Intensity</span>
        <input type="number" min={0} max={8} step={0.1} value={settings.intensity} onChange={(event) => onChange({ ...settings, intensity: Number(event.target.value) })} />
      </label>
      <label className="field-stack">
        <span>Blur</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.blur} onChange={(event) => onChange({ ...settings, blur: Number(event.target.value) })} />
      </label>
      <label className="field-stack">
        <span>Rotation</span>
        <input type="range" min={-180} max={180} step={1} value={settings.rotation} onChange={(event) => onChange({ ...settings, rotation: Number(event.target.value) })} />
      </label>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="custom-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
