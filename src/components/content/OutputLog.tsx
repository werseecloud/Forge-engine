import { Trash2 } from "lucide-react";
import { commands } from "../../lib/tauri";
import { useLogStore } from "../../stores/useLogStore";
import { EmptyState } from "../shared/EmptyState";
import { IconButton } from "../shared/IconButton";

export function OutputLog() {
  const outputLogs = useLogStore((state) => state.outputLogs);
  const setOutputLogs = useLogStore((state) => state.setOutputLogs);
  const clearLogs = useLogStore((state) => state.clearLogs);

  async function clear() {
    await commands.clearOutputLog();
    clearLogs();
  }

  if (outputLogs.length === 0) {
    return <EmptyState title="No output yet" detail="Project, import, and editor events will be written here." />;
  }

  return (
    <div className="log-panel">
      <div className="log-panel__toolbar">
        <span>{outputLogs.length} log lines</span>
        <IconButton label="Clear log" onClick={clear}><Trash2 size={14} /></IconButton>
      </div>
      <pre>{outputLogs.join("\n")}</pre>
    </div>
  );
}

