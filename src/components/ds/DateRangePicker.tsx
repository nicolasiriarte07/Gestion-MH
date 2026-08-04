"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

const PRESETS = [
  { key: "month", label: "Este mes" },
  { key: "prev_month", label: "Mes anterior" },
  { key: "30d", label: "Últimos 30 días" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "year", label: "Este año" },
] as const;

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRange(key: string): { from: string; to: string } {
  const today = new Date();
  switch (key) {
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toISO(from), to: toISO(today) };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: toISO(from), to: toISO(today) };
    }
    case "prev_month": {
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 86_400_000);
      const firstOfPrevMonth = new Date(
        lastOfPrevMonth.getFullYear(),
        lastOfPrevMonth.getMonth(),
        1
      );
      return { from: toISO(firstOfPrevMonth), to: toISO(lastOfPrevMonth) };
    }
    case "year": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toISO(from), to: toISO(today) };
    }
    case "month":
    default: {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISO(from), to: toISO(today) };
    }
  }
}

function formatDisplay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function DateRangePicker({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
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

  function pushRange(range: { from: string; to: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", range.from);
    params.set("to", range.to);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const toDate = new Date(`${to}T00:00:00`);
  const year = toDate.getFullYear();

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-mh-border bg-white px-4 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50"
      >
        <Calendar size={16} className="text-mh-ink-muted" />
        {formatDisplay(from)} - {formatDisplay(to)} {year}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-mh-border bg-white p-3 shadow-lg">
          <div className="space-y-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => pushRange(computeRange(p.key))}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-mh-ink hover:bg-mh-pink-light hover:text-mh-pink"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2 border-t border-mh-border pt-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
              />
              <span className="text-mh-ink-muted">-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
              />
            </div>
            <button
              onClick={() => pushRange({ from: customFrom, to: customTo })}
              className="w-full rounded-lg bg-mh-pink px-3 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark"
            >
              Aplicar rango personalizado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
