"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product, Brand } from "@/lib/types";

export default function WebOutOfStockAlert({
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
    <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-red-900">
            ⚠ Publicados en la web sin stock
          </p>
          <p className="text-xs text-red-700">
            {`${rows.length} producto(s) marcado(s) "en web" con 0 unidades.`}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-red-700 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <>
          <div className="max-h-80 divide-y divide-red-100 overflow-y-auto border-t border-red-200">
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
                <p className="shrink-0 text-sm font-semibold text-red-600">
                  0 en stock
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-red-200 px-4 py-2">
            <Link
              href="/inventario?stockMax=0&web=yes"
              className="text-xs font-medium text-red-800 underline"
            >
              Ver todos en la tabla
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
