"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { globalSearch, type GlobalSearchResult } from "./globalSearchActions";

// Expone "abrir la paleta" para el botón de búsqueda del Topbar, además
// del atajo de teclado Cmd/Ctrl+K que maneja el propio CommandPalette.
const CommandPaletteContext = createContext<(() => void) | null>(null);

export function useCommandPalette(): () => void {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette debe usarse dentro de <CommandPaletteProvider>");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <CommandPaletteContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

// Paleta de búsqueda global (Cmd/Ctrl+K): abre en cualquier pantalla de
// la app, busca en productos/contactos/ventas con un pequeño debounce,
// y navega al módulo correspondiente al elegir un resultado.
function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const setOpen = onOpenChange;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    // Resetea el estado interno cada vez que se abre (prop externa),
    // no una sincronización derivable sin efecto.
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const r = await globalSearch(query);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  const grouped = results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div
      className="font-inter fixed inset-0 z-[90] flex items-start justify-center bg-slate-900/40 px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-mh-border bg-mh-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-mh-border px-4 py-3.5">
          {loading ? (
            <Loader2 size={17} className="shrink-0 animate-spin text-mh-ink-muted" />
          ) : (
            <Search size={17} className="shrink-0 text-mh-ink-muted" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos, contactos, ventas..."
            className="w-full bg-transparent text-sm text-mh-ink placeholder:text-mh-ink-muted focus:outline-none"
          />
          <kbd className="shrink-0 rounded-md border border-mh-border px-1.5 py-0.5 text-[10px] font-semibold text-mh-ink-muted">
            Esc
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === "" && (
            <p className="px-3 py-6 text-center text-sm text-mh-ink-muted">
              Escribí para buscar en toda la app.
            </p>
          )}
          {query.trim() !== "" && !loading && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-mh-ink-muted">Sin resultados.</p>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-bold text-mh-ink-muted uppercase">
                {group}
              </p>
              {items.map((r) => (
                <button
                  key={`${group}-${r.id}`}
                  onClick={() => goTo(r.href)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-mh-bg"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-mh-ink">
                    {r.title}
                  </span>
                  {r.subtitle && (
                    <span className="shrink-0 truncate text-xs text-mh-ink-muted">
                      {r.subtitle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
