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
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setParam("compare", enabled ? "off" : "on")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
          enabled
            ? "bg-brand text-white"
            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        Comparar períodos
      </button>

      {enabled && (
        <>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(
              [
                { key: "previous", label: "Período anterior" },
                { key: "year", label: "Mismo período año anterior" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setParam("compareMode", opt.key)}
                className={`rounded px-3 py-1 text-sm font-medium ${
                  mode === opt.key
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {compareFrom && compareTo && (
            <span className="text-xs text-slate-500">
              vs {formatDisplayDate(compareFrom)} — {formatDisplayDate(compareTo)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
