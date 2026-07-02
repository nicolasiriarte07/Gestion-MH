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
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
        {(
          [
            { key: "ventas", label: "Ventas" },
            { key: "facturacion", label: "Facturación" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setParam("metric", opt.key)}
            className={`rounded px-3 py-1 text-sm font-medium ${
              metric === opt.key
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {metric === "facturacion" && (
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
          {(
            [
              { key: "ars", label: "ARS" },
              { key: "usd", label: "USD" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setParam("currency", opt.key)}
              className={`rounded px-3 py-1 text-sm font-medium ${
                currency === opt.key
                  ? "bg-brand text-white"
                  : "text-slate-600 hover:bg-slate-100"
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
