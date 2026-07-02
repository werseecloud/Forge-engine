import { AlertTriangle, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { useBlueprintStore } from "../state/blueprintStore";

export function BlueprintConsole() {
  const diagnostics = useBlueprintStore((state) => state.diagnostics);
  const compileResult = useBlueprintStore((state) => state.compileResult);
  const runResult = useBlueprintStore((state) => state.runResult);
  const compile = useBlueprintStore((state) => state.compile);
  const runPreview = useBlueprintStore((state) => state.runPreview);

  return (
    <section className="blueprint-console">
      <header>
        <div>
          <strong>Compiler / Console</strong>
          <span>{compileResult?.success ? `Compiled graph ready in ${Math.round((compileResult.compileTimeMicros ?? 0) / 1000)} ms` : "Validation and runtime trace"}</span>
        </div>
        <button className="blueprint-action" onClick={() => void compile()}><CheckCircle2 size={15} />Compile Graph</button>
        <button className="blueprint-action" onClick={() => void runPreview()}><PlayCircle size={15} />Run Preview</button>
      </header>
      <div className="blueprint-console__body">
        <div>
          <h4>Diagnostics</h4>
          {diagnostics.length === 0 ? <p><Circle size={12} /> No compile issues.</p> : diagnostics.map((diag) => (
            <p key={diag.id} className={`is-${diag.severity}`}>
              <AlertTriangle size={12} />
              <span>{diag.message}</span>
              <em>{diag.recovery}</em>
            </p>
          ))}
        </div>
        <div>
          <h4>Execution Trace</h4>
          {(runResult?.traces ?? []).length === 0 ? <p><Circle size={12} /> Run Preview to see node execution.</p> : runResult?.traces.map((trace, index) => (
            <p key={`${trace.nodeId}-${index}`} className="is-trace">
              <PlayCircle size={12} />
              <span>{trace.nodeTitle}: {trace.message}</span>
              <em>{trace.elapsedMicros}µs</em>
            </p>
          ))}
          {(runResult?.commands ?? []).map((command, index) => (
            <p key={`command-${index}`} className="is-info">
              <PlayCircle size={12} />
              <span>Command queued: {command.commandType}</span>
              <em>{Object.keys(command.payload).join(", ")}</em>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
