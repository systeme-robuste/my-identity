import type { ReactNode } from "react";

/**
 * Placeholder. Will be implemented with Radix Dialog in Phase 1.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-mi-bg border border-mi-muted/30 rounded-mi p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
