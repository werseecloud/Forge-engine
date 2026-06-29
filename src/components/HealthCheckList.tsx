import { useInstallerStore } from "../stores/useInstallerStore";

export function HealthCheckList() {
  const health = useInstallerStore((s) => s.healthChecks);
  return (
    <div className="health-list">
      {health.map((item) => (
        <div key={item.componentId} className={`health-row ${item.status}`}>
          <span>{item.status === "passed" ? "✓" : item.status === "warning" ? "!" : "×"}</span>
          <b>{item.displayName}</b>
          <em>{item.status === "passed" ? "OK" : item.status.toUpperCase()}</em>
        </div>
      ))}
    </div>
  );
}

