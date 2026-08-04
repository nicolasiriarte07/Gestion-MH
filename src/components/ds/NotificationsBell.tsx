"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

// Todavía no existe un sistema de notificaciones real en la base de
// datos, así que el panel siempre muestra "sin novedades" en vez de
// inventar datos. Queda el lugar visual listo para cuando haya algo
// real que mostrar (ej. alertas de stock, ventas grandes).
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-mh-border bg-white text-mh-ink-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50"
        title="Notificaciones"
      >
        <Bell size={18} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-mh-border bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-mh-ink">Notificaciones</p>
          <p className="mt-2 text-sm text-mh-ink-muted">
            No tenés notificaciones nuevas.
          </p>
        </div>
      )}
    </div>
  );
}
