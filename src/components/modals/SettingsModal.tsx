import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { commands } from "../../lib/tauri";
import type { AppSettings } from "../../types/settings";
import { PathPicker } from "../shared/PathPicker";
import { PillButton } from "../shared/PillButton";

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings | null;
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
  onError: (message: string) => void;
}

export function SettingsModal({ open, settings, onClose, onSaved, onError }: SettingsModalProps) {
  const [draft, setDraft] = useState<AppSettings | null>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings, open]);

  async function save() {
    if (!draft) return;
    try {
      const saved = await commands.updateSettings(draft);
      onSaved(saved);
      onClose();
    } catch (error) {
      onError(String(error));
    }
  }

  return (
    <AnimatePresence>
      {open && draft ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <h2>Settings</h2>
              <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
            </div>
            <div className="modal__body form-grid">
              <label className="span-2">
                <span>Default projects directory</span>
                <PathPicker value={draft.defaultProjectsDir} onChange={(defaultProjectsDir) => setDraft({ ...draft, defaultProjectsDir })} />
              </label>
              <label>
                <span>UI scale</span>
                <input type="number" min="0.8" max="1.4" step="0.05" value={draft.uiScale} onChange={(event) => setDraft({ ...draft, uiScale: Number(event.target.value) })} />
              </label>
              <label>
                <span>Autosave interval</span>
                <input type="number" min="30" step="30" value={draft.autosaveInterval} onChange={(event) => setDraft({ ...draft, autosaveInterval: Number(event.target.value) })} />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={draft.autosaveEnabled} onChange={(event) => setDraft({ ...draft, autosaveEnabled: event.target.checked })} />
                <span>Autosave enabled</span>
              </label>
            </div>
            <div className="modal__footer">
              <PillButton onClick={onClose}>Cancel</PillButton>
              <PillButton active onClick={save} icon={<Save size={15} />}>Save</PillButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

