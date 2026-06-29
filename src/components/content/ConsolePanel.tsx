import { Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { commands } from "../../lib/tauri";
import { useLogStore } from "../../stores/useLogStore";
import { IconButton } from "../shared/IconButton";

export function ConsolePanel() {
  const entries = useLogStore((state) => state.consoleEntries);
  const pushConsole = useLogStore((state) => state.pushConsole);
  const clearConsole = useLogStore((state) => state.clearConsole);
  const [command, setCommand] = useState("");

  async function runCommand() {
    const text = command.trim();
    if (!text) return;
    setCommand("");
    pushConsole(`> ${text}`);
    if (text === "help") {
      pushConsole("Commands: help, clear, log <message>, time, engine status");
      return;
    }
    if (text === "clear") {
      clearConsole();
      return;
    }
    if (text === "time") {
      pushConsole(new Date().toLocaleString());
      return;
    }
    if (text.startsWith("log ")) {
      const line = await commands.appendOutputLog(text.slice(4));
      pushConsole(line.trim());
      return;
    }
    if (text === "engine status") {
      const steps = await commands.startEngineServices();
      steps.forEach((step) => pushConsole(`${step.component}: ${step.status}`));
      return;
    }
    pushConsole(`Unknown command: ${text}`);
  }

  return (
    <div className="console-panel">
      <div className="console-output">{entries.length === 0 ? "Console ready. Type help." : entries.join("\n")}</div>
      <div className="console-input">
        <input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runCommand(); }} placeholder="help" />
        <IconButton label="Run command" onClick={() => void runCommand()}><Send size={14} /></IconButton>
        <IconButton label="Clear console" onClick={clearConsole}><Trash2 size={14} /></IconButton>
      </div>
    </div>
  );
}
