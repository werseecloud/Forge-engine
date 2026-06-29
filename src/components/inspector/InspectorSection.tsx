import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface InspectorSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function InspectorSection({ title, children, defaultOpen = true }: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="inspector-section">
      <button className="inspector-section__header" onClick={() => setOpen(!open)}>
        <ChevronDown size={15} className={open ? "" : "is-closed"} />
        <span>{title}</span>
      </button>
      {open ? <div className="inspector-section__body">{children}</div> : null}
    </section>
  );
}

