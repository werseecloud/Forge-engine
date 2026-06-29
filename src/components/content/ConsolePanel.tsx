import { useLogStore } from "../../stores/useLogStore";
import { EmptyState } from "../shared/EmptyState";

export function ConsolePanel() {
  const entries = useLogStore((state) => state.consoleEntries);
  if (entries.length === 0) {
    return <EmptyState title="Console idle" detail="No console commands have been run in this session." />;
  }
  return <pre className="console-panel">{entries.join("\n")}</pre>;
}

