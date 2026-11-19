"use client";

import type { BusinessUnit } from "@/lib/types";

export default function BusinessUnitSwitch({
  businessUnits,
  activeId,
  onSelect,
}: {
  businessUnits: BusinessUnit[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="font-inter inline-flex items-center gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {businessUnits.map((bu) => (
        <button
          key={bu.id}
          onClick={() => onSelect(bu.id)}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            activeId === bu.id
              ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
          }`}
        >
          {bu.name}
        </button>
      ))}
    </div>
  );
}
