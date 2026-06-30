import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Terminal, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { commands, type EngineBootStep } from "../../lib/tauri";
import { PillButton } from "../shared/PillButton";

interface EngineStartupSplashProps {
  onComplete: (steps: EngineBootStep[]) => void;
}

export function EngineStartupSplash({ onComplete }: EngineStartupSplashProps) {
  const [visible, setVisible] = useState(true);
  const [running, setRunning] = useState(true);
  const [steps, setSteps] = useState<EngineBootStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const result = await commands.startEngineServices();
        if (cancelled) return;
        setSteps(result);
        onCompleteRef.current(result);
      } catch (bootError) {
        if (cancelled) return;
        setError(String(bootError));
      } finally {
        if (!cancelled) setRunning(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const failed = steps.some((step) => step.status !== "ok") || !!error;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div className="startup-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="startup-modal" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
            <div className="startup-modal__header">
              <div className="forge-mark">F</div>
              <div>
                <span>Forge Engine 1.0.0</span>
                <h2>Starting 3D engine services</h2>
              </div>
              {running ? <Loader2 className="spin" size={20} /> : failed ? <XCircle className="tone-error" size={20} /> : <CheckCircle2 className="tone-ok" size={20} />}
            </div>
            <div className="startup-terminal">
              <div><Terminal size={14} /> boot terminal</div>
              <pre>
{`> resolving local Forge Engine binaries
> running backend health checks
${steps.map((step) => `$ ${step.command}
[${step.status}] ${step.component}
${step.stdout || step.stderr}`).join("\n")}
${running ? "> waiting for engine services..." : failed ? "> startup completed with warnings/errors" : "> engine services ready"}`}
              </pre>
            </div>
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="startup-modal__footer">
              <PillButton active={!running && !failed} disabled={running} onClick={() => setVisible(false)}>
                {running ? "Starting..." : failed ? "Continue with warnings" : "Open Forge Engine"}
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
