import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

export function PillButton({ active, icon, children, className = "", ...props }: PillButtonProps) {
  return (
    <button type="button" className={`pill-button ${active ? "is-active" : ""} ${className}`} aria-pressed={active} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
