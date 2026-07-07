import { AnimatePresence, motion } from "framer-motion";
import { Check, Mountain, Save, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatBytes } from "../../lib/formatBytes";
import { commands } from "../../lib/tauri";
import { useProjectStore } from "../../stores/useProjectStore";
import { useSceneStore } from "../../stores/useSceneStore";
import type { CreateWorldResult, MapSize, QualityMode, WorldAssetManifest, WorldConfig, WorldType } from "../../types/world";
import { CustomSelect } from "../shared/CustomSelect";
import { PillButton } from "../shared/PillButton";

const worldTypes: WorldType[] = ["EmptyWorld", "Grassland", "Mountains", "Forest", "Desert", "Snow", "Island", "RockyValley", "ProceduralMixedWorld"];
const mapSizes: MapSize[] = ["Small", "Medium", "Large", "Huge", "Custom"];
const qualityModes: QualityMode[] = ["Auto", "Low", "Medium", "High", "Ultra"];
const materialPresets = ["Grassland", "Mountain", "Forest", "Desert", "Snow", "Rocky Valley"] as const;

interface CreateWorldModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateWorldResult) => void;
  onError: (message: string) => void;
}

export function CreateWorldModal({ open, onClose, onCreated, onError }: CreateWorldModalProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeLevel = useSceneStore((state) => state.activeLevel);
  const [busy, setBusy] = useState(false);
  const [assetManifest, setAssetManifest] = useState<WorldAssetManifest | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [config, setConfig] = useState<WorldConfig>(() => defaultWorldConfig());
  const resolvedMapSize = useMemo(() => {
    if (config.mapSize === "Small") return 512;
    if (config.mapSize === "Medium") return 1024;
    if (config.mapSize === "Large") return 2048;
    if (config.mapSize === "Huge") return 4096;
    return config.customMapSize ?? 1024;
  }, [config.customMapSize, config.mapSize]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setAssetError(null);
    commands.discoverWorldAssets()
      .then((manifest) => {
        if (!cancelled) setAssetManifest(manifest);
      })
      .catch((error) => {
        if (!cancelled) {
          setAssetManifest(null);
          setAssetError(String(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function generateWorld() {
    if (!currentProject || !activeLevel) {
      onError("Open a project and level before creating a world.");
      return;
    }
    if (!config.worldName.trim()) {
      onError("World name is required.");
      return;
    }
    setBusy(true);
    try {
      const result = await commands.createWorld({
        projectRoot: currentProject.rootPath,
        levelPath: activeLevel.path,
        config
      });
      onCreated(result);
      onClose();
    } catch (error) {
      onError(String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal modal--wide world-modal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <div>
                <h2>Create New World</h2>
                <span>Generate terrain, materials, scatter layers and a real World entity for the active level.</span>
              </div>
              <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="world-modal__body">
              <section className="world-modal__section">
                <h3>Basic</h3>
                <div className="world-grid">
                  <label className="field-stack span-2">
                    <span>World name</span>
                    <input value={config.worldName} onChange={(event) => setConfig({ ...config, worldName: event.target.value })} />
                  </label>
                  <CustomSelect label="World type" value={config.worldType} options={worldTypes} onChange={(worldType) => setConfig({ ...config, worldType, textures: { ...config.textures, terrainMaterialPreset: materialPresetForWorldType(worldType) } })} />
                  <CustomSelect label="Map size" value={config.mapSize} options={mapSizes} onChange={(mapSize) => setConfig({ ...config, mapSize })} />
                  {config.mapSize === "Custom" ? <NumberField label="Custom size" value={config.customMapSize ?? 1024} onChange={(customMapSize) => setConfig({ ...config, customMapSize })} /> : null}
                  <NumberField label="Terrain resolution" value={config.terrainResolution} onChange={(terrainResolution) => setConfig({ ...config, terrainResolution })} />
                  <NumberField label="Seed" value={config.seed} onChange={(seed) => setConfig({ ...config, seed })} />
                </div>
                <p className="world-preview-note">Preview: {resolvedMapSize}m x {resolvedMapSize}m, {config.terrainResolution} samples, {config.worldType.replace(/([A-Z])/g, " $1").trim()}.</p>
              </section>

              <section className="world-modal__section">
                <h3>Terrain</h3>
                <div className="world-grid">
                  <NumberField label="Max height" value={config.terrain.maxHeight} onChange={(maxHeight) => setConfig({ ...config, terrain: { ...config.terrain, maxHeight } })} />
                  <NumberField label="Mountain height" value={config.terrain.mountainHeight} onChange={(mountainHeight) => setConfig({ ...config, terrain: { ...config.terrain, mountainHeight } })} />
                  <NumberField label="Hill strength" value={config.terrain.hillStrength} step={0.1} onChange={(hillStrength) => setConfig({ ...config, terrain: { ...config.terrain, hillStrength } })} />
                  <NumberField label="Valley depth" value={config.terrain.valleyDepth} onChange={(valleyDepth) => setConfig({ ...config, terrain: { ...config.terrain, valleyDepth } })} />
                  <NumberField label="Roughness" value={config.terrain.roughness} step={0.05} onChange={(roughness) => setConfig({ ...config, terrain: { ...config.terrain, roughness } })} />
                  <NumberField label="Erosion" value={config.terrain.erosion} step={0.05} onChange={(erosion) => setConfig({ ...config, terrain: { ...config.terrain, erosion } })} />
                  <NumberField label="Noise scale" value={config.terrain.noiseScale} step={0.1} onChange={(noiseScale) => setConfig({ ...config, terrain: { ...config.terrain, noiseScale } })} />
                  <NumberField label="Water level" value={config.terrain.waterLevel} onChange={(waterLevel) => setConfig({ ...config, terrain: { ...config.terrain, waterLevel } })} />
                  <ToggleField label="Flat spawn area" checked={config.terrain.flatSpawnArea} onChange={(flatSpawnArea) => setConfig({ ...config, terrain: { ...config.terrain, flatSpawnArea } })} />
                </div>
              </section>

              <section className="world-modal__section">
                <h3>Textures & PBR</h3>
                <div className="world-grid">
                  <ToggleField label="Standard Forge textures" checked={config.textures.useStandardForgeTextures} onChange={(useStandardForgeTextures) => setConfig({ ...config, textures: { ...config.textures, useStandardForgeTextures } })} />
                  <ToggleField label="Use PBR textures" checked={config.textures.usePbrTextures} onChange={(usePbrTextures) => setConfig({ ...config, textures: { ...config.textures, usePbrTextures } })} />
                  <CustomSelect label="Texture quality" value={config.textures.textureResolution} options={qualityModes} onChange={(textureResolution) => setConfig({ ...config, textures: { ...config.textures, textureResolution } })} />
                  <CustomSelect label="Material preset" value={config.textures.terrainMaterialPreset as typeof materialPresets[number]} options={materialPresets} onChange={(terrainMaterialPreset) => setConfig({ ...config, textures: { ...config.textures, terrainMaterialPreset } })} />
                  <ToggleField label="Blend by height" checked={config.textures.blendByHeight} onChange={(blendByHeight) => setConfig({ ...config, textures: { ...config.textures, blendByHeight } })} />
                  <ToggleField label="Blend by slope" checked={config.textures.blendBySlope} onChange={(blendBySlope) => setConfig({ ...config, textures: { ...config.textures, blendBySlope } })} />
                  <ToggleField label="Blend by biome" checked={config.textures.blendByBiome} onChange={(blendByBiome) => setConfig({ ...config, textures: { ...config.textures, blendByBiome } })} />
                  <ToggleField label="Auto optimize textures" checked={config.textures.autoOptimizeTextures} onChange={(autoOptimizeTextures) => setConfig({ ...config, textures: { ...config.textures, autoOptimizeTextures } })} />
                </div>
                <button className="secondary-button world-slot-button" disabled><Upload size={15} /> Custom PBR texture slots are stored in the config; file import is next.</button>
                <div className="world-asset-status">
                  <div>
                    <strong>Packaged world assets</strong>
                    <span>{assetError ? assetError : `${assetManifest?.materials.length ?? 0} material packs, ${assetManifest?.props.length ?? 0} prop packs found`}</span>
                  </div>
                  <div className="world-asset-list">
                    {(assetManifest?.materials ?? []).map((asset) => (
                      <span key={asset.id}>{asset.displayName} · {formatBytes(asset.sizeBytes)}</span>
                    ))}
                    {(assetManifest?.props ?? []).map((asset) => (
                      <span key={asset.id}>{asset.displayName} · {formatBytes(asset.sizeBytes)}</span>
                    ))}
                    {!assetManifest && !assetError ? <span>Scanning local engine content...</span> : null}
                  </div>
                </div>
              </section>

              <section className="world-modal__section">
                <h3>Environment Scatter</h3>
                <div className="world-grid">
                  <NumberField label="Grass density" value={config.environment.grassDensity} onChange={(grassDensity) => setConfig({ ...config, environment: { ...config.environment, grassDensity } })} />
                  <NumberField label="Rock density" value={config.environment.rockDensity} onChange={(rockDensity) => setConfig({ ...config, environment: { ...config.environment, rockDensity } })} />
                  <NumberField label="Tree density" value={config.environment.treeDensity} onChange={(treeDensity) => setConfig({ ...config, environment: { ...config.environment, treeDensity } })} />
                  <NumberField label="Bush density" value={config.environment.bushDensity} onChange={(bushDensity) => setConfig({ ...config, environment: { ...config.environment, bushDensity } })} />
                  <NumberField label="Flower density" value={config.environment.flowerDensity} onChange={(flowerDensity) => setConfig({ ...config, environment: { ...config.environment, flowerDensity } })} />
                  <ToggleField label="Avoid water" checked={config.environment.avoidWater} onChange={(avoidWater) => setConfig({ ...config, environment: { ...config.environment, avoidWater } })} />
                  <ToggleField label="Avoid spawn area" checked={config.environment.avoidSpawnArea} onChange={(avoidSpawnArea) => setConfig({ ...config, environment: { ...config.environment, avoidSpawnArea } })} />
                  <ToggleField label="Align to slope" checked={config.environment.alignObjectsToSlope} onChange={(alignObjectsToSlope) => setConfig({ ...config, environment: { ...config.environment, alignObjectsToSlope } })} />
                </div>
              </section>

              <section className="world-modal__section">
                <h3>Performance</h3>
                <div className="world-grid">
                  <ToggleField label="Auto-detect PC performance" checked={config.performance.autoDetectPcPerformance} onChange={(autoDetectPcPerformance) => setConfig({ ...config, performance: { ...config.performance, autoDetectPcPerformance } })} />
                  <CustomSelect label="Texture quality" value={config.performance.textureQuality} options={qualityModes} onChange={(textureQuality) => setConfig({ ...config, performance: { ...config.performance, textureQuality } })} />
                  <CustomSelect label="Terrain LOD" value={config.performance.terrainLod} options={qualityModes} onChange={(terrainLod) => setConfig({ ...config, performance: { ...config.performance, terrainLod } })} />
                  <CustomSelect label="Grass quality" value={config.performance.grassQuality} options={qualityModes} onChange={(grassQuality) => setConfig({ ...config, performance: { ...config.performance, grassQuality } })} />
                  <CustomSelect label="Rock quality" value={config.performance.rockQuality} options={qualityModes} onChange={(rockQuality) => setConfig({ ...config, performance: { ...config.performance, rockQuality } })} />
                  <NumberField label="Foliage distance" value={config.performance.foliageDistance} onChange={(foliageDistance) => setConfig({ ...config, performance: { ...config.performance, foliageDistance } })} />
                  <NumberField label="Density multiplier" value={config.performance.objectDensityMultiplier} step={0.1} onChange={(objectDensityMultiplier) => setConfig({ ...config, performance: { ...config.performance, objectDensityMultiplier } })} />
                  <ToggleField label="Terrain chunks" checked={config.performance.terrainChunks} onChange={(terrainChunks) => setConfig({ ...config, performance: { ...config.performance, terrainChunks } })} />
                  <ToggleField label="Streaming" checked={config.performance.streaming} onChange={(streaming) => setConfig({ ...config, performance: { ...config.performance, streaming } })} />
                  <ToggleField label="Occlusion culling" checked={config.performance.occlusionCulling} onChange={(occlusionCulling) => setConfig({ ...config, performance: { ...config.performance, occlusionCulling } })} />
                  <ToggleField label="Impostors" checked={config.performance.impostors} onChange={(impostors) => setConfig({ ...config, performance: { ...config.performance, impostors } })} />
                  <ToggleField label="Texture compression" checked={config.performance.textureCompression} onChange={(textureCompression) => setConfig({ ...config, performance: { ...config.performance, textureCompression } })} />
                </div>
              </section>
            </div>

            <div className="modal__footer">
              <PillButton onClick={onClose}>Cancel</PillButton>
              <PillButton onClick={() => setConfig(defaultWorldConfig())} icon={<Save size={15} />}>Load Preset</PillButton>
              <PillButton active onClick={generateWorld} disabled={busy} icon={<Mountain size={15} />}>{busy ? "Generating..." : "Generate World"}</PillButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function NumberField({ label, value, step = 1, onChange }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field-stack">
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="custom-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function materialPresetForWorldType(worldType: WorldType) {
  if (worldType === "Mountains" || worldType === "RockyValley") return "Mountain";
  if (worldType === "Forest") return "Forest";
  if (worldType === "Desert") return "Desert";
  if (worldType === "Snow") return "Snow";
  return "Grassland";
}

function defaultWorldConfig(): WorldConfig {
  return {
    worldName: "New World",
    worldType: "Grassland",
    mapSize: "Medium",
    customMapSize: null,
    terrainResolution: 513,
    seed: Math.floor(Math.random() * 900000) + 100000,
    terrain: {
      maxHeight: 180,
      mountainHeight: 520,
      hillStrength: 0.7,
      valleyDepth: 90,
      roughness: 0.55,
      erosion: 0.2,
      noiseScale: 1.0,
      biomeBlending: 0.45,
      waterLevel: 12,
      flatSpawnArea: true,
      playerSpawnPoint: [0, 0, 0]
    },
    textures: {
      useStandardForgeTextures: true,
      usePbrTextures: true,
      textureResolution: "Auto",
      autoOptimizeTextures: true,
      terrainMaterialPreset: "Grassland",
      blendByHeight: true,
      blendBySlope: true,
      blendByBiome: true,
      pbrLayers: []
    },
    environment: {
      grassDensity: 1800,
      rockDensity: 260,
      treeDensity: 120,
      bushDensity: 220,
      flowerDensity: 140,
      randomObjectPlacement: true,
      objectScaleVariation: 0.35,
      objectRotationVariation: 1,
      avoidSpawnArea: true,
      avoidWater: true,
      alignObjectsToSlope: true
    },
    performance: {
      autoDetectPcPerformance: true,
      textureQuality: "Auto",
      terrainLod: "Auto",
      grassQuality: "Auto",
      rockQuality: "Auto",
      foliageDistance: 450,
      objectDensityMultiplier: 1,
      terrainChunks: true,
      streaming: true,
      occlusionCulling: true,
      impostors: true,
      textureCompression: true
    }
  };
}
