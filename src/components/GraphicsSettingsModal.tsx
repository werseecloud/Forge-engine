import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { engineBridge } from "../lib/engineBridge";
import type { BackendCapabilities, DebugView, GpuStats, GraphicsSettings, QualityPreset, RendererPath } from "../types/renderer";
import { CustomSelect } from "./shared/CustomSelect";
import { PillButton } from "./shared/PillButton";
import { RendererStatsPanel } from "./RendererStatsPanel";

interface GraphicsSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: GraphicsSettings) => void;
  onError: (message: string) => void;
}

const rendererPaths: RendererPath[] = ["ForwardPlus", "Deferred", "HybridRayTracing", "PathTracing"];
const qualityPresets: QualityPreset[] = ["Low", "Medium", "High", "Ultra", "Cinematic"];
const debugViews: DebugView[] = ["Lit", "Unlit", "Albedo", "Normals", "Roughness", "Metallic", "Depth", "MotionVectors", "LightClusters", "ShadowCascades", "Wireframe", "Overdraw", "GpuTimings"];

export function GraphicsSettingsModal({ open, onClose, onSaved, onError }: GraphicsSettingsModalProps) {
  const [settings, setSettings] = useState<GraphicsSettings | null>(null);
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);
  const [stats, setStats] = useState<GpuStats | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      try {
        const [loadedSettings, loadedCapabilities, loadedStats] = await Promise.all([
          engineBridge.getRendererSettings(),
          engineBridge.getBackendCapabilities(),
          engineBridge.getGpuStats()
        ]);
        if (cancelled) return;
        setSettings(loadedSettings);
        setCapabilities(loadedCapabilities);
        setStats(loadedStats);
      } catch (error) {
        if (!cancelled) onError(String(error));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [onError, open]);

  async function save() {
    if (!settings) return;
    try {
      const saved = await engineBridge.updateRendererSettings(settings);
      setSettings(saved);
      onSaved(saved);
      onClose();
    } catch (error) {
      onError(String(error));
    }
  }

  async function resetAccumulation() {
    try {
      await engineBridge.resetPathTracingAccumulation();
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal modal--wide graphics-modal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <div>
                <h2>Graphics Settings</h2>
                <p>Renderer state is owned by Rust. Unsupported GPU options are disabled by capability checks.</p>
              </div>
              <button className="icon-button" aria-label="Close graphics settings" onClick={onClose}><X size={18} /></button>
            </div>
            {settings ? (
              <div className="graphics-modal__body">
                <RendererStatsPanel capabilities={capabilities} stats={stats} />
                <section className="graphics-section">
                  <h3>Renderer</h3>
                  <div className="graphics-grid">
                    <CustomSelect label="Renderer path" value={settings.rendererPath} options={rendererPaths} onChange={(rendererPath) => setSettings({ ...settings, rendererPath })} />
                    <CustomSelect label="Quality preset" value={settings.qualityPreset} options={qualityPresets} onChange={(qualityPreset) => setSettings({ ...settings, qualityPreset })} />
                    <CustomSelect label="Debug view" value={settings.debugView} options={debugViews} onChange={(debugView) => setSettings({ ...settings, debugView })} />
                  </div>
                </section>
                <section className="graphics-section">
                  <h3>Ray Tracing</h3>
                  <p className="graphics-section__note">
                    {capabilities?.rayTracingSupport.reason ?? "Detecting ray tracing support..."}
                  </p>
                  <div className="toggle-grid">
                    <Toggle label="RT shadows" disabled={!capabilities?.supportsRayTracing} checked={settings.rayTracedShadows} onChange={(rayTracedShadows) => setSettings({ ...settings, rayTracedShadows })} />
                    <Toggle label="RT reflections" disabled={!capabilities?.supportsRayTracing} checked={settings.rayTracedReflections} onChange={(rayTracedReflections) => setSettings({ ...settings, rayTracedReflections })} />
                    <Toggle label="RT AO" disabled={!capabilities?.supportsRayTracing} checked={settings.rayTracedAo} onChange={(rayTracedAo) => setSettings({ ...settings, rayTracedAo })} />
                    <Toggle label="RT GI" disabled={!capabilities?.supportsRayTracing} checked={settings.rayTracedGi} onChange={(rayTracedGi) => setSettings({ ...settings, rayTracedGi })} />
                  </div>
                </section>
                <section className="graphics-section">
                  <h3>Path Tracing</h3>
                  <p className="graphics-section__note">
                    {capabilities?.rayTracingSupport.computeBvhFallbackAvailable
                      ? "Compute BVH fallback is available for progressive path tracing experiments."
                      : "Path tracing needs compute shader support before it can run."}
                  </p>
                  <div className="graphics-grid">
                    <NumberField label="Samples per pixel" min={1} max={4096} value={settings.pathTracing.samplesPerPixel} onChange={(samplesPerPixel) => setSettings({ ...settings, pathTracing: { ...settings.pathTracing, samplesPerPixel } })} />
                    <NumberField label="Max bounces" min={1} max={32} value={settings.pathTracing.maxBounces} onChange={(maxBounces) => setSettings({ ...settings, pathTracing: { ...settings.pathTracing, maxBounces } })} />
                    <NumberField label="Firefly clamp" min={0} max={100} step={0.5} value={settings.pathTracing.fireflyClamp} onChange={(fireflyClamp) => setSettings({ ...settings, pathTracing: { ...settings.pathTracing, fireflyClamp } })} />
                    <Toggle label="Denoiser" checked={settings.pathTracing.denoiserEnabled} onChange={(denoiserEnabled) => setSettings({ ...settings, pathTracing: { ...settings.pathTracing, denoiserEnabled } })} />
                    <PillButton onClick={resetAccumulation} icon={<RotateCcw size={15} />}>Reset accumulation</PillButton>
                  </div>
                </section>
                <section className="graphics-section">
                  <h3>Lighting and Performance</h3>
                  <div className="graphics-grid">
                    <CustomSelect label="GI mode" value={settings.giMode} options={["None", "Probes", "ScreenSpace", "DDGI Planned", "Hardware RT Planned"]} onChange={(giMode) => setSettings({ ...settings, giMode })} />
                    <CustomSelect label="Shadow quality" value={settings.shadowQuality} options={["Low", "Medium", "High", "Ultra"]} onChange={(shadowQuality) => setSettings({ ...settings, shadowQuality })} />
                    <CustomSelect label="Reflection quality" value={settings.reflectionQuality} options={["Off", "Probes", "ScreenSpace", "RayTraced"]} onChange={(reflectionQuality) => setSettings({ ...settings, reflectionQuality })} />
                    <CustomSelect label="Volumetric quality" value={settings.volumetricQuality} options={["Off", "Low", "Medium", "High"]} onChange={(volumetricQuality) => setSettings({ ...settings, volumetricQuality })} />
                    <NumberField label="Resolution scale" min={0.25} max={1.5} step={0.05} value={settings.resolutionScale} onChange={(resolutionScale) => setSettings({ ...settings, resolutionScale })} />
                    <NumberField label="Texture budget MB" min={256} max={32768} step={256} value={settings.textureBudgetMb} onChange={(textureBudgetMb) => setSettings({ ...settings, textureBudgetMb })} />
                    <NumberField label="Max lights" min={1} max={4096} value={settings.maxLights} onChange={(maxLights) => setSettings({ ...settings, maxLights })} />
                    <Toggle label="Dynamic resolution" checked={settings.dynamicResolution} onChange={(dynamicResolution) => setSettings({ ...settings, dynamicResolution })} />
                    <Toggle label="VSync" checked={settings.vsync} onChange={(vsync) => setSettings({ ...settings, vsync })} />
                  </div>
                </section>
              </div>
            ) : (
              <div className="graphics-modal__loading">Loading renderer state...</div>
            )}
            <div className="modal__footer">
              <PillButton onClick={onClose}>Cancel</PillButton>
              <PillButton active disabled={!settings} onClick={save} icon={<Save size={15} />}>Apply</PillButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field-stack">
      <span>{label}</span>
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
