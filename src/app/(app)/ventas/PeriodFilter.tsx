"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PRESETS = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "30d", label: "Últimos 30 días" },
  { key: "prev_month", label: "Mes anterior" },
  { key: "month", label: "Este mes" },
  { key: "year", label: "Este año" },
  { key: "all", label: "Todo" },
];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRange(key: string): { from: string; to: string } {
  const today = new Date();
  switch (key) {
    case "today":
      return { from: toISO(today), to: toISO(today) };
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
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISO(from), to: toISO(today) };
    }
    case "year": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toISO(from), to: toISO(today) };
    }
    default:
      return { from: "2000-01-01", to: toISO(today) };
  }
}

export default function PeriodFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function pushRange(range: { from: string; to: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", range.from);
    params.set("to", range.to);
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPreset(key: string) {
    pushRange(computeRange(key));
    setShowCustom(false);
  }

  const activePresetKey = PRESETS.find((p) => {
    const range = computeRange(p.key);
    return range.from === from && range.to === to;
  })?.key;

  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activePresetKey === p.key
                ? "bg-mh-pink text-white"
                : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((s) => !s)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            !activePresetKey
              ? "bg-mh-pink text-white"
              : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
          }`}
        >
          Personalizado
        </button>
        <span className="ml-auto text-xs font-medium text-mh-ink-muted">
          {from} — {to}
        </span>
      </div>

      {showCustom && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-mh-border pt-4">
          <label className="text-xs font-semibold text-mh-ink-muted">
            Desde
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="ml-2 rounded-lg border border-mh-border px-2.5 py-1.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold text-mh-ink-muted">
            Hasta
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="ml-2 rounded-lg border border-mh-border px-2.5 py-1.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
            />
          </label>
          <button
            onClick={() => pushRange({ from: customFrom, to: customTo })}
            className="rounded-lg bg-mh-pink px-3 py-2 text-xs font-semibold text-white hover:bg-mh-pink-dark"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
