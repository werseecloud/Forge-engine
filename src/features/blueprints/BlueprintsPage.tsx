import { useEffect } from "react";
import { BlueprintCanvas } from "./components/BlueprintCanvas";
import { BlueprintConsole } from "./components/BlueprintConsole";
import { useState } from "react";
import { BlueprintRightPanel } from "./components/BlueprintRightPanel";
import { GraphExplorer } from "./components/GraphExplorer";
import { BlueprintsFullscreenLayout } from "./layout/BlueprintsFullscreenLayout";
import { useBlueprintStore } from "./state/blueprintStore";

interface BlueprintsPageProps {
  projectRoot: string | null;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BlueprintsPage({ projectRoot, onClose, onError, onSuccess }: BlueprintsPageProps) {
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const deleteSelection = useBlueprintStore((state) => state.deleteSelection);
  const copySelection = useBlueprintStore((state) => state.copySelection);
  const pasteSelection = useBlueprintStore((state) => state.pasteSelection);
  const createCommentBox = useBlueprintStore((state) => state.createCommentBox);
  const focusSelection = useBlueprintStore((state) => state.focusSelection);
  const undo = useBlueprintStore((state) => state.undo);
  const redo = useBlueprintStore((state) => state.redo);
  const openSearch = useBlueprintStore((state) => state.openSearch);
  const dirty = useBlueprintStore((state) => state.dirty);
  const saveGraph = useBlueprintStore((state) => state.saveGraph);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || (event.altKey && event.key === "ArrowLeft")) {
        event.preventDefault();
        requestClose();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        copySelection();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        pasteSelection();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelection();
      }
      if (event.key.toLowerCase() === "f" && !(event.target instanceof HTMLInputElement)) {
        focusSelection();
      }
      if (event.key.toLowerCase() === "c" && !(event.target instanceof HTMLInputElement) && !event.ctrlKey && !event.metaKey) {
        createCommentBox();
      }
      if (event.code === "Space" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        openSearch({ x: 420, y: 220 });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copySelection, createCommentBox, deleteSelection, focusSelection, openSearch, pasteSelection, redo, undo]);

  function requestClose() {
    dirty ? setLeavePromptOpen(true) : onClose();
  }

  async function saveAndLeave() {
    if (!projectRoot) {
      onError("Open a project before saving Blueprint graphs.");
      return;
    }
    await saveGraph(projectRoot);
    setLeavePromptOpen(false);
    onClose();
  }

  return (
    <BlueprintsFullscreenLayout projectRoot={projectRoot} onBack={requestClose} onError={onError} onSuccess={onSuccess}>
      <div className="blueprints-page__workspace">
        <GraphExplorer projectRoot={projectRoot} onError={onError} />
        <main className="blueprints-page__center">
          <BlueprintCanvas />
          <BlueprintConsole />
        </main>
        <BlueprintRightPanel />
      </div>
      {leavePromptOpen ? (
        <div className="blueprint-leave-modal">
          <div>
            <h3>Save changes before leaving?</h3>
            <p>Your Blueprint graph has unsaved changes.</p>
            <footer>
              <button className="secondary-btn" onClick={() => setLeavePromptOpen(false)}>Cancel</button>
              <button className="secondary-btn" onClick={() => { setLeavePromptOpen(false); onClose(); }}>Leave Without Saving</button>
              <button className="primary-btn" onClick={() => void saveAndLeave()}>Save & Leave</button>
            </footer>
          </div>
        </div>
      ) : null}
    </BlueprintsFullscreenLayout>
  );
}
