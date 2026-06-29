import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { commands } from "../../lib/tauri";
import type { SceneLevel } from "../../types/scene";
import { PillButton } from "../shared/PillButton";

interface CreateLevelModalProps {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onCreated: (level: SceneLevel) => void;
  onError: (message: string) => void;
}

export function CreateLevelModal({ open, projectRoot, onClose, onCreated, onError }: CreateLevelModalProps) {
  const [name, setName] = useState("Main");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!projectRoot) return;
    setBusy(true);
    try {
      const level = await commands.createLevel(projectRoot, name);
      onCreated(level);
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
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <h2>Create Level</h2>
              <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
            </div>
            <div className="modal__body form-grid">
              <label>
                <span>Level name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            </div>
            <div className="modal__footer">
              <PillButton onClick={onClose}>Cancel</PillButton>
              <PillButton active onClick={create} disabled={busy} icon={<Check size={15} />}>{busy ? "Creating..." : "Create"}</PillButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

