import { Plus, Trash2 } from "lucide-react";
import { IconButton } from "../../../components/shared/IconButton";
import { CustomSelect } from "../../../components/shared/CustomSelect";
import { useBlueprintStore } from "../state/blueprintStore";
import type { BlueprintDataType } from "../types/blueprint-types";

const dataTypes: BlueprintDataType[] = ["Bool", "Int", "Float", "String", "Vector3", "EntityRef", "AssetRef", "SceneRef", "Any"];

export function BlueprintInspector() {
  const graph = useBlueprintStore((state) => state.activeGraph);
  const selectedNodeIds = useBlueprintStore((state) => state.selectedNodeIds);
  const updateNodeProperties = useBlueprintStore((state) => state.updateNodeProperties);
  const setActiveGraph = useBlueprintStore((state) => state.setActiveGraph);
  const selectedNode = graph?.nodes.find((node) => node.id === selectedNodeIds[0]) ?? null;

  if (!graph) {
    return <aside className="blueprint-inspector"><h3>Inspector</h3><p>No graph loaded.</p></aside>;
  }

  if (!selectedNode) {
    return (
      <aside className="blueprint-inspector">
        <h3>Graph Settings</h3>
        <label>Graph name<input value={graph.name} onChange={(event) => setActiveGraph({ ...graph, name: event.target.value })} /></label>
        <label>Graph type<input value={graph.graphType} onChange={(event) => setActiveGraph({ ...graph, graphType: event.target.value })} /></label>
        <section>
          <div className="blueprint-inspector__row">
            <strong>Variables</strong>
            <IconButton
              label="Add variable"
              onClick={() => setActiveGraph({ ...graph, variables: [...graph.variables, { id: crypto.randomUUID(), name: "Variable", dataType: "Float", defaultValue: 0, exposed: false }] })}
            >
              <Plus size={14} />
            </IconButton>
          </div>
          {graph.variables.map((variable) => (
            <div className="blueprint-variable-row" key={variable.id}>
              <input value={variable.name} onChange={(event) => setActiveGraph({ ...graph, variables: graph.variables.map((item) => item.id === variable.id ? { ...item, name: event.target.value } : item) })} />
              <CustomSelect value={variable.dataType} options={dataTypes} onChange={(dataType) => setActiveGraph({ ...graph, variables: graph.variables.map((item) => item.id === variable.id ? { ...item, dataType: dataType as BlueprintDataType } : item) })} />
              <IconButton label="Delete variable" onClick={() => setActiveGraph({ ...graph, variables: graph.variables.filter((item) => item.id !== variable.id) })}><Trash2 size={14} /></IconButton>
            </div>
          ))}
        </section>
      </aside>
    );
  }

  return (
    <aside className="blueprint-inspector">
      <h3>Node Inspector</h3>
      <div className="blueprint-node-summary">
        <strong>{selectedNode.title}</strong>
        <span>{selectedNode.type}</span>
        <p>{String(selectedNode.metadata.description ?? "No description.")}</p>
      </div>
      {Object.entries(selectedNode.properties).length === 0 ? <p>No editable properties for this node.</p> : null}
      {Object.entries(selectedNode.properties).map(([key, value]) => (
        <label key={key}>
          {key}
          <input
            value={typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : JSON.stringify(value)}
            onChange={(event) => {
              const raw = event.target.value;
              const next = typeof value === "number" ? Number(raw) : typeof value === "boolean" ? raw === "true" : raw;
              updateNodeProperties(selectedNode.id, { [key]: next });
            }}
          />
        </label>
      ))}
      <label>
        Comment
        <input value={selectedNode.comment} onChange={(event) => setActiveGraph({ ...graph, nodes: graph.nodes.map((node) => node.id === selectedNode.id ? { ...node, comment: event.target.value } : node) })} />
      </label>
    </aside>
  );
}
