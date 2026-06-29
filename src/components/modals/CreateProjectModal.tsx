import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, FolderTree, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { commands } from "../../lib/tauri";
import type { CreateProjectRequest, OpenProjectResponse } from "../../types/project";
import { PathPicker } from "../shared/PathPicker";
import { PillButton } from "../shared/PillButton";

const steps = ["Basic Info", "Template", "Technical Setup", "Folder Preview", "Review"];
const templates = ["Blank Project", "First Person", "Third Person", "Open World", "Simulation", "Film", "Architecture", "Tool/Plugin"];

interface CreateProjectModalProps {
  open: boolean;
  defaultLocation: string;
  onClose: () => void;
  onCreated: (response: OpenProjectResponse) => void;
  onError: (message: string) => void;
}

export function CreateProjectModal({ open, defaultLocation, onClose, onCreated, onError }: CreateProjectModalProps) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<CreateProjectRequest>({
    projectName: "",
    location: defaultLocation,
    description: "",
    template: "Blank Project",
    renderBackend: "wgpu",
    targetPlatform: "Windows",
    starterContent: false,
    sourceControlIgnore: true,
    createDefaultScene: true
  });

  const projectPath = useMemo(() => {
    const safe = (form.projectName.trim() || "Untitled").replace(/[^\w -]+/g, "_").replace(/\s+/g, "_");
    return `${form.location}\\${safe}`;
  }, [form.location, form.projectName]);

  useEffect(() => {
    if (open && defaultLocation && !form.location) {
      setForm((current) => ({ ...current, location: defaultLocation }));
    }
  }, [defaultLocation, form.location, open]);

  async function create() {
    if (!form.projectName.trim()) {
      onError("Project name is required.");
      return;
    }
    if (!form.location.trim()) {
      onError("Project location is required.");
      return;
    }
    setBusy(true);
    try {
      const response = await commands.createProject(form);
      onCreated(response);
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
          <motion.div className="modal modal--wide" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="modal__header">
              <div>
                <span className="eyebrow">Forge Project</span>
                <h2>Create Project</h2>
              </div>
              <button className="icon-button" aria-label="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="stepper">
              {steps.map((label, index) => (
                <button key={label} className={index === step ? "is-active" : ""} onClick={() => setStep(index)}>
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            <div className="modal__body">
              {step === 0 ? (
                <div className="form-grid">
                  <label>
                    <span>Project name</span>
                    <input value={form.projectName} onChange={(event) => setForm({ ...form, projectName: event.target.value })} placeholder="My Forge Project" />
                  </label>
                  <label>
                    <span>Location</span>
                    <PathPicker value={form.location} onChange={(location) => setForm({ ...form, location })} />
                  </label>
                  <label className="span-2">
                    <span>Description</span>
                    <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Optional project notes" />
                  </label>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="template-grid">
                  {templates.map((template) => (
                    <button key={template} className={form.template === template ? "template-card is-active" : "template-card"} onClick={() => setForm({ ...form, template })}>
                      <FolderTree size={18} />
                      <strong>{template}</strong>
                      <span>{template === "Blank Project" ? "Available now" : "Requires template files"}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="form-grid">
                  <label>
                    <span>Engine version</span>
                    <input value="1.0.0" readOnly />
                  </label>
                  <label>
                    <span>Render backend</span>
                    <select value={form.renderBackend} onChange={(event) => setForm({ ...form, renderBackend: event.target.value })}>
                      <option value="wgpu">wgpu</option>
                    </select>
                  </label>
                  <label>
                    <span>Target platform</span>
                    <select value={form.targetPlatform} onChange={(event) => setForm({ ...form, targetPlatform: event.target.value })}>
                      <option>Windows</option>
                    </select>
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.sourceControlIgnore} onChange={(event) => setForm({ ...form, sourceControlIgnore: event.target.checked })} />
                    <span>Create source control ignore file</span>
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.createDefaultScene} onChange={(event) => setForm({ ...form, createDefaultScene: event.target.checked })} />
                    <span>Create default level</span>
                  </label>
                </div>
              ) : null}

              {step === 3 ? (
                <pre className="folder-preview">{`${projectPath}
  ForgeProject.forge
  .forge/
    project_state.json
    asset_index.json
    editor_layout.json
    recent_selections.json
  Config/
  Content/
    Scenes/
    Levels/
    Blueprints/
    Materials/
    Meshes/
    Textures/
    Audio/
    Animations/
    UI/
    VFX/
    Data/
  Source/
  Plugins/
  Build/
  Cache/
  Saved/
  Screenshots/`}</pre>
              ) : null}

              {step === 4 ? (
                <div className="review-list">
                  <div><span>Final path</span><strong>{projectPath}</strong></div>
                  <div><span>Template</span><strong>{form.template}</strong></div>
                  <div><span>Renderer</span><strong>{form.renderBackend}</strong></div>
                  <div><span>Starter content</span><strong>{form.starterContent ? "Enabled" : "Disabled"}</strong></div>
                </div>
              ) : null}
            </div>

            <div className="modal__footer">
              <PillButton onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} icon={<ChevronLeft size={15} />}>
                Back
              </PillButton>
              {step < steps.length - 1 ? (
                <PillButton active onClick={() => setStep(Math.min(steps.length - 1, step + 1))} icon={<ChevronRight size={15} />}>
                  Next
                </PillButton>
              ) : (
                <PillButton active onClick={create} disabled={busy} icon={<Check size={15} />}>
                  {busy ? "Creating..." : "Create"}
                </PillButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
