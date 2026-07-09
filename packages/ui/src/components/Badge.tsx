import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger";
  children: ReactNode;
}

export function Badge({ variant = "default", className = "", children, ...rest }: BadgeProps) {
  const v =
    variant === "success"
      ? "bg-green-500/20 text-green-300"
      : variant === "warning"
        ? "bg-yellow-500/20 text-yellow-300"
        : variant === "danger"
          ? "bg-red-500/20 text-red-300"
          : "bg-mi-muted/20 text-mi-fg";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${v} ${className}`} {...rest}>
      {children}
    </span>
  );
}
