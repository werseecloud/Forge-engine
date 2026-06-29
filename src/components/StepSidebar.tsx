import { useInstallerStore } from "../stores/useInstallerStore";

export const steps = ["Welcome", "System Check", "Installation Type", "Install Location", "Project Folder", "Components", "Folder Preview", "Ready to Install", "Installing", "Health Check", "Complete"];

export function StepSidebar() {
  const step = useInstallerStore((s) => s.step);
  return (
    <aside className="step-sidebar">
      <div className="logo-panel"><div className="forge-logo">F</div><strong>FORGE</strong><span>ENGINE</span></div>
      <nav>
        {steps.map((label, index) => (
          <div key={label} className={`step-item ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}>
            <b>{index < step ? "✓" : index + 1}</b><span>{label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
