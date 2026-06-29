import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

export function PillButton({ active, icon, children, className = "", ...props }: PillButtonProps) {
  return (
    <button className={`pill-button ${active ? "is-active" : ""} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

