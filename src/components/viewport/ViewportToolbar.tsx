import { Camera, Grid2X2, SunMedium } from "lucide-react";
import { PillButton } from "../shared/PillButton";

export function ViewportToolbar() {
  return (
    <div className="viewport-toolbar">
      <PillButton active icon={<Camera size={14} />}>Perspective</PillButton>
      <PillButton icon={<SunMedium size={14} />}>Lit</PillButton>
      <PillButton>Show</PillButton>
      <div className="viewport-toolbar__spacer" />
      <PillButton icon={<Grid2X2 size={14} />}>10°</PillButton>
      <PillButton>1.0</PillButton>
    </div>
  );
}

