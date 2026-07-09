import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-mi border border-mi-muted/30 bg-mi-bg text-mi-fg focus:border-mi-primary focus:outline-none ${className}`}
      {...rest}
    />
  );
}
