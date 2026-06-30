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
