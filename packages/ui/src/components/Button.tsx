import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: ButtonProps) {
  const v =
    variant === "primary"
      ? "bg-mi-primary text-white hover:opacity-90"
      : variant === "secondary"
        ? "border border-mi-muted/30 text-mi-fg hover:bg-mi-muted/10"
        : "text-mi-primary hover:underline";
  const s = size === "sm" ? "px-2 py-1 text-sm" : size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2 text-base";
  return (
    <button className={`inline-flex items-center justify-center rounded-mi font-semibold transition ${v} ${s} ${className}`} {...rest}>
      {children}
    </button>
  );
}
