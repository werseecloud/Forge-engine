import { Sparkles } from "lucide-react";
import { IconButton } from "../shared/IconButton";

export function WerseeAIHeaderButton({ onOpen }: { onOpen: () => void }) {
  return (
    <IconButton label="Wersee AI (Ctrl+I)" onClick={onOpen}>
      <Sparkles size={17} />
    </IconButton>
  );
}
