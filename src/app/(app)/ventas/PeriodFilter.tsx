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
    <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activePresetKey === p.key
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((s) => !s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            !activePresetKey
              ? "bg-brand text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Personalizado
        </button>
        <span className="ml-auto text-xs text-slate-500">
          {from} — {to}
        </span>
      </div>

      {showCustom && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <label className="text-xs text-slate-500">
            Desde
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-500">
            Hasta
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <button
            onClick={() => pushRange({ from: customFrom, to: customTo })}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
