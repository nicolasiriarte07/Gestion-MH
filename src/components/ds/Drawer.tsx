"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// Panel lateral genérico (desde la derecha) del sistema de diseño nuevo.
// A diferencia de Modal (centrado, para formularios cortos), el Drawer es
// para ver el detalle de algo sin abandonar la lista de atrás.
export default function Drawer({
  open,
  onClose,
  children,
  widthClassName = "w-full max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="font-inter fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full flex-col overflow-y-auto border-l border-mh-border bg-mh-surface shadow-xl ${widthClassName}`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
