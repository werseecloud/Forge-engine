import { AnimatePresence, motion } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import forgeSplashBg from "../../assets/splash/forge-splash-bg.png";
import werseeLogo from "../../assets/splash/wersee-logo.png";
import { commands, type EngineBootStep } from "../../lib/tauri";

interface EngineStartupSplashProps {
  onComplete: (steps: EngineBootStep[]) => void;
}

interface EngineBootStatus {
  label: string;
  detail: string;
}

export function EngineStartupSplash({ onComplete }: EngineStartupSplashProps) {
  const [visible, setVisible] = useState(true);
  const [running, setRunning] = useState(true);
  const [steps, setSteps] = useState<EngineBootStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EngineBootStatus>({
    label: "Starting engine",
    detail: "Preparing Forge Engine services"
  });
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let cleanupStatus: (() => void) | undefined;
    let cleanupStep: (() => void) | undefined;
    async function boot() {
      try {
        cleanupStatus = await listen<EngineBootStatus>("engine_boot_status", (event) => {
          if (!cancelled) setStatus(event.payload);
        });
        cleanupStep = await listen<EngineBootStep>("engine_boot_step_completed", (event) => {
          if (!cancelled) setSteps((current) => [...current, event.payload]);
        });
        const result = await commands.startEngineServices();
        if (cancelled) return;
        setSteps(result);
        const failed = result.some((step) => step.status !== "ok");
        setStatus({
          label: failed ? "Startup completed with warnings" : "Engine ready",
          detail: failed ? "Opening editor; check Output Log for service warnings" : "Opening Forge Engine editor"
        });
        onCompleteRef.current(result);
        window.setTimeout(() => {
          if (!cancelled) setVisible(false);
        }, failed ? 1200 : 700);
      } catch (bootError) {
        if (cancelled) return;
        setError(String(bootError));
        setStatus({
          label: "Startup issue detected",
          detail: "Opening editor; check Output Log for details"
        });
        window.setTimeout(() => {
          if (!cancelled) setVisible(false);
        }, 1800);
      } finally {
        if (!cancelled) setRunning(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
      cleanupStatus?.();
      cleanupStep?.();
    };
  }, []);

  const failed = steps.some((step) => step.status !== "ok") || !!error;
  const okCount = steps.filter((step) => step.status === "ok").length;
  const totalCount = Math.max(steps.length, 5);
  const statusIcon = running ? <Loader2 className="spin" size={18} /> : failed ? <XCircle size={18} /> : <CheckCircle2 size={18} />;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div className="startup-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="startup-splash"
            style={{ backgroundImage: `url(${forgeSplashBg})` }}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
          >
            <div className="startup-splash__shade" />
            <div className="startup-splash__top">
              <div className="forge-mark">F</div>
              <span className={failed ? "startup-splash__state startup-splash__state--error" : "startup-splash__state"}>
                {statusIcon}
              </span>
            </div>
            <div className="startup-splash__bottom">
              <div className="startup-pill startup-pill--brand">
                <strong>Forge Engine</strong>
                <span>3D Editor 1.0.0</span>
              </div>
              <div className="startup-pill startup-pill--status">
                <span>{status.label}</span>
                <strong>{status.detail}</strong>
                <em>{okCount}/{totalCount} services ready</em>
              </div>
              <div className="startup-pill startup-pill--logo" aria-label="Wersee Developers">
                <img src={werseeLogo} alt="Wersee Developers" />
              </div>
            </div>
            {error ? <div className="startup-splash__error">{error}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
