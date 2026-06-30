import { useEffect } from "react";
import { BlueprintCanvas } from "./components/BlueprintCanvas";
import { BlueprintConsole } from "./components/BlueprintConsole";
import { BlueprintInspector } from "./components/BlueprintInspector";
import { BlueprintToolbar } from "./components/BlueprintToolbar";
import { GraphExplorer } from "./components/GraphExplorer";
import { useBlueprintStore } from "./state/blueprintStore";

interface BlueprintsPageProps {
  projectRoot: string | null;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BlueprintsPage({ projectRoot, onClose, onError, onSuccess }: BlueprintsPageProps) {
  const deleteSelection = useBlueprintStore((state) => state.deleteSelection);
  const undo = useBlueprintStore((state) => state.undo);
  const redo = useBlueprintStore((state) => state.redo);
  const openSearch = useBlueprintStore((state) => state.openSearch);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelection();
      }
      if (event.code === "Space" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        openSearch({ x: 420, y: 220 });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelection, openSearch, redo, undo]);

  return (
    <section className="blueprints-page">
      <BlueprintToolbar projectRoot={projectRoot} onClose={onClose} onError={onError} onSuccess={onSuccess} />
      <div className="blueprints-page__workspace">
        <GraphExplorer projectRoot={projectRoot} onError={onError} />
        <main className="blueprints-page__center">
          <BlueprintCanvas />
          <BlueprintConsole />
        </main>
        <BlueprintInspector />
      </div>
    </section>
  );
}
