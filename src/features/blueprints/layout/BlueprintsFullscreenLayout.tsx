import type { ReactNode } from "react";
import { BlueprintTabHeader } from "../components/BlueprintTabHeader";

interface BlueprintsFullscreenLayoutProps {
  projectRoot: string | null;
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  children: ReactNode;
}

export function BlueprintsFullscreenLayout({ projectRoot, onBack, onError, onSuccess, children }: BlueprintsFullscreenLayoutProps) {
  return (
    <section className="blueprints-fullscreen-layout">
      <BlueprintTabHeader projectRoot={projectRoot} onBack={onBack} onError={onError} onSuccess={onSuccess} />
      {children}
    </section>
  );
}
