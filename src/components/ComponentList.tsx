import { formatBytes } from "../lib/formatBytes";
import { useInstallerStore } from "../stores/useInstallerStore";

export function ComponentList() {
  const components = useInstallerStore((s) => s.components);
  const set = useInstallerStore((s) => s.set);
  return (
    <div className="component-list">
      {components.map((component) => (
        <label key={component.id} className={`component-row ${!component.available ? "missing" : ""}`}>
          <input
            type="checkbox"
            checked={component.selected}
            disabled={component.required}
            onChange={(event) => set({ components: components.map((item) => item.id === component.id ? { ...item, selected: event.target.checked } : item) })}
          />
          <span>{component.displayName}</span>
          <em>{component.available ? formatBytes(component.sizeBytes) : "Missing"}</em>
          {component.error ? <small>{component.error}</small> : null}
        </label>
      ))}
    </div>
  );
}

