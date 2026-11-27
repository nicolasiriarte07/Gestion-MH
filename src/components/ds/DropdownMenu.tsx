"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export type DropdownMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
};

// Menú flotante con acciones (por default el botón "⋯", pero acepta
// cualquier `trigger` -ej. el "+ Nuevo" del Topbar-). Sin librería
// (ni Radix): cierra solo al clickear afuera o con Escape.
export default function DropdownMenu({
  items,
  align = "right",
  trigger,
}: {
  items: DropdownMenuItem[];
  align?: "left" | "right";
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="font-inter relative inline-block">
      <button onClick={() => setOpen((v) => !v)} aria-label="Más acciones">
        {trigger ?? (
          <span className="flex h-9 w-9 items-center justify-center rounded-mh-control text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink">
            <MoreHorizontal size={17} />
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-mh-border bg-mh-surface py-1 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-mh-bg ${
                item.danger ? "text-mh-danger" : "text-mh-ink"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
