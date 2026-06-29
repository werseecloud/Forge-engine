import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  detail: string;
  actions?: ReactNode;
}

export function EmptyState({ title, detail, actions }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{detail}</p>
      {actions ? <div className="empty-state__actions">{actions}</div> : null}
    </div>
  );
}
