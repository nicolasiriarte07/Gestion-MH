"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type StockMetric = "unidades" | "dinero";

const OPTIONS = [
  { key: "unidades", label: "Unidades" },
  { key: "dinero", label: "Dinero" },
] as const;

export default function StockMetricToggle({ value }: { value: StockMetric }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(next: StockMetric) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stockMetric", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 shadow-sm bg-white p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => select(opt.key)}
          className={`rounded px-3 py-1 text-sm font-medium ${
            value === opt.key
              ? "bg-brand text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
