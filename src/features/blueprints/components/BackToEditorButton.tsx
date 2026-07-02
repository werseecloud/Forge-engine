import { ArrowLeft } from "lucide-react";

interface BackToEditorButtonProps {
  onClick: () => void;
}

export function BackToEditorButton({ onClick }: BackToEditorButtonProps) {
  return (
    <button className="blueprint-back-button" onClick={onClick} title="Back to Editor (Esc / Alt+Left)">
      <ArrowLeft size={17} />
      <span>Back to Editor</span>
    </button>
  );
}
