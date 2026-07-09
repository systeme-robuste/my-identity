import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-mi border border-mi-muted/20 bg-mi-bg p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
