import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { commands } from "../../lib/tauri";
import { useAppStore } from "../../stores/useAppStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { SceneObject } from "../../types/scene";
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
        <label className="field-stack">
          <span>Name</span>
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={draft.visible} onChange={(event) => setDraft({ ...draft, visible: event.target.checked })} />
          <span>Visible</span>
        </label>
        <label className="field-stack">
          <span>Tags</span>
          <input value={draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </label>
      </InspectorSection>
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
