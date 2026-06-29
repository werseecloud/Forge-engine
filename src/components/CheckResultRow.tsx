import type { CheckResult } from "../types/installer";

export function CheckResultRow({ check }: { check: CheckResult }) {
  return (
    <div className={`check-row ${check.status}`}>
      <span>{check.status === "passed" ? "✓" : check.status === "warning" ? "!" : "×"}</span>
      <b>{check.label}</b>
      <em>{check.value}</em>
    </div>
  );
}

