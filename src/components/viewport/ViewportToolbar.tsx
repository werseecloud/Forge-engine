import { Camera, Grid2X2, Mountain, SunMedium } from "lucide-react";
import { PillButton } from "../shared/PillButton";

export type ViewPreset = "Perspective" | "Top" | "Front" | "Right";
export type ShadingMode = "Lit" | "Unlit";

interface ViewportToolbarProps {
  viewPreset: ViewPreset;
  shadingMode: ShadingMode;
  showEnvironment: boolean;
  gridVisible: boolean;
  onViewPresetChange: (viewPreset: ViewPreset) => void;
  onShadingModeChange: (shadingMode: ShadingMode) => void;
  onShowEnvironmentChange: (showEnvironment: boolean) => void;
  onGridVisibleChange: (gridVisible: boolean) => void;
}

const viewCycle: ViewPreset[] = ["Perspective", "Top", "Front", "Right"];

export function ViewportToolbar({
  viewPreset,
  shadingMode,
  showEnvironment,
  gridVisible,
  onViewPresetChange,
  onShadingModeChange,
  onShowEnvironmentChange,
  onGridVisibleChange
}: ViewportToolbarProps) {
  function nextViewPreset() {
    const index = viewCycle.indexOf(viewPreset);
    onViewPresetChange(viewCycle[(index + 1) % viewCycle.length]);
  }

  return (
    <div className="viewport-toolbar">
      <PillButton active icon={<Camera size={14} />} onClick={nextViewPreset}>{viewPreset}</PillButton>
      <PillButton active={shadingMode === "Lit"} icon={<SunMedium size={14} />} onClick={() => onShadingModeChange(shadingMode === "Lit" ? "Unlit" : "Lit")}>{shadingMode}</PillButton>
      <PillButton active={showEnvironment} icon={<Mountain size={14} />} onClick={() => onShowEnvironmentChange(!showEnvironment)}>World</PillButton>
      <div className="viewport-toolbar__spacer" />
      <PillButton active={gridVisible} icon={<Grid2X2 size={14} />} onClick={() => onGridVisibleChange(!gridVisible)}>Grid</PillButton>
      <PillButton disabled>1.0</PillButton>
    </div>
  );
}
