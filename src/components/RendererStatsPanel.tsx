import type { BackendCapabilities, GpuStats } from "../types/renderer";

interface RendererStatsPanelProps {
  capabilities: BackendCapabilities | null;
  stats: GpuStats | null;
}

export function RendererStatsPanel({ capabilities, stats }: RendererStatsPanelProps) {
  return (
    <div className="renderer-stats-panel">
      <div>
        <span>Backend</span>
        <strong>{capabilities?.backendName ?? stats?.backendName ?? "Detecting"}</strong>
      </div>
      <div>
        <span>Adapter</span>
        <strong>{capabilities?.adapterName ?? stats?.adapterName ?? "Unknown"}</strong>
      </div>
      <div>
        <span>Hardware RT</span>
        <strong>{capabilities?.supportsRayTracing ? "Available" : "Unavailable"}</strong>
      </div>
      <div>
        <span>GPU timings</span>
        <strong>{capabilities?.supportsTimestampQueries ? "Available" : "Unavailable"}</strong>
      </div>
      <div>
        <span>Texture compression</span>
        <strong>{compressionSummary(capabilities)}</strong>
      </div>
      <div>
        <span>Frame</span>
        <strong>{stats ? `${stats.frameTimeMs.toFixed(2)} ms` : "No live frame yet"}</strong>
      </div>
    </div>
  );
}

function compressionSummary(capabilities: BackendCapabilities | null) {
  if (!capabilities) return "Detecting";
  const formats = [];
  if (capabilities.supportsTextureCompressionBc) formats.push("BCn");
  if (capabilities.supportsTextureCompressionAstc) formats.push("ASTC");
  if (capabilities.supportsTextureCompressionEtc2) formats.push("ETC2");
  return formats.length ? formats.join(" / ") : "None reported";
}
