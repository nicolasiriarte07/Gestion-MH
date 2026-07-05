"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product, Brand } from "@/lib/types";

export default function LowStockAlerts({
  rows,
  brands,
}: {
  rows: Product[];
  brands: Brand[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const brandName = new Map(brands.map((b) => [b.id, b.name]));

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-amber-900">
            ⚠ Alertas de stock bajo
          </p>
          <p className="text-xs text-amber-700">
            {rows.length} producto(s) con 0 o 1 unidad en stock.
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-amber-700 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <>
          <div className="max-h-80 divide-y divide-amber-100 overflow-y-auto border-t border-amber-200">
            {rows.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {p.description}{" "}
                    <span className="font-normal text-slate-400">({p.sku})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.brand_id ? (brandName.get(p.brand_id) ?? "") : "Sin marca"}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}
                >
                  {p.stock} en stock
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-amber-200 px-4 py-2">
            <Link
              href="/inventario?stockMax=1"
              className="text-xs font-medium text-amber-800 underline"
            >
              Ver todos en la tabla
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
