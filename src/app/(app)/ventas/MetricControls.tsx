"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type Metric = "ventas" | "facturacion";
export type Currency = "ars" | "usd";

export default function MetricControls({
  metric,
  currency,
}: {
  metric: Metric;
  currency: Currency;
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
    <div className="font-inter flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1 rounded-xl border border-mh-border bg-mh-surface p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {(
          [
            { key: "ventas", label: "Ventas" },
            { key: "facturacion", label: "Facturación" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setParam("metric", opt.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              metric === opt.key
                ? "bg-mh-pink text-white"
                : "text-mh-ink-muted hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {metric === "facturacion" && (
        <div className="flex items-center gap-1 rounded-xl border border-mh-border bg-mh-surface p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {(
            [
              { key: "ars", label: "ARS" },
              { key: "usd", label: "USD" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setParam("currency", opt.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                currency === opt.key
                  ? "bg-mh-pink text-white"
                  : "text-mh-ink-muted hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
