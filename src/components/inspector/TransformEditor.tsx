import type { Transform, Vec3 } from "../../types/scene";

interface TransformEditorProps {
  value: Transform;
  onChange: (value: Transform) => void;
}

export function TransformEditor({ value, onChange }: TransformEditorProps) {
  function vecRow(label: string, key: keyof Transform, vec: Vec3) {
    return (
      <div className="vec-row">
        <span>{label}</span>
        {(["x", "y", "z"] as const).map((axis) => (
          <label key={axis}>
            <small>{axis.toUpperCase()}</small>
            <input
              type="number"
              step="0.1"
              value={vec[axis]}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]: { ...vec, [axis]: Number(event.target.value) }
                })
              }
            />
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="transform-editor">
      {vecRow("Location", "position", value.position)}
      {vecRow("Rotation", "rotation", value.rotation)}
      {vecRow("Scale", "scale", value.scale)}
    </div>
  );
}

