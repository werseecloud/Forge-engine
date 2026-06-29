import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  children: ReactNode;
}

export function IconButton({ label, active, children, className = "", ...props }: IconButtonProps) {
  return (
    <button className={`icon-button ${active ? "is-active" : ""} ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

