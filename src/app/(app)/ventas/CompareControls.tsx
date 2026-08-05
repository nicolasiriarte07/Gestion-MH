"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type CompareMode = "previous" | "year";

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function CompareControls({
  enabled,
  mode,
  compareFrom,
  compareTo,
}: {
  enabled: boolean;
  mode: CompareMode;
  compareFrom?: string;
  compareTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="font-inter flex flex-wrap items-center gap-3">
      <button
        onClick={() => setParam("compare", enabled ? "off" : "on")}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
          enabled
            ? "bg-mh-pink text-white"
            : "border border-mh-border bg-mh-surface text-mh-ink-muted hover:bg-slate-50"
        }`}
      >
        Comparar períodos
      </button>

      {enabled && (
        <>
          <div className="flex items-center gap-1 rounded-xl border border-mh-border bg-mh-surface p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {(
              [
                { key: "previous", label: "Período anterior" },
                { key: "year", label: "Mismo período año anterior" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setParam("compareMode", opt.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  mode === opt.key
                    ? "bg-mh-pink text-white"
                    : "text-mh-ink-muted hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {compareFrom && compareTo && (
            <span className="text-xs font-medium text-mh-ink-muted">
              vs {formatDisplayDate(compareFrom)} — {formatDisplayDate(compareTo)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
