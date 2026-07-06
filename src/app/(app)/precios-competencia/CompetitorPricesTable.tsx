"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompetitorSite, Product, ProductCompetitorPrice } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { searchCompetitorPrices } from "./actions";

export type CompetitorPriceRow = ProductCompetitorPrice & { site: CompetitorSite };

const STATUS_LABELS: Record<string, string> = {
  ok: "Encontrado",
  not_found: "No encontrado",
  error: "Error al buscar",
};

const STATUS_COLORS: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  not_found: "bg-slate-100 text-slate-500",
  error: "bg-red-100 text-red-700",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export default function CompetitorPricesTable({
  product,
  initialRows,
}: {
  product: Product;
  initialRows: CompetitorPriceRow[];
}) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setSearching(true);
    setError(null);

    const result = await searchCompetitorPrices(product.id, product.description);
    setSearching(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Precio propio (P. Contado / P. Web)
          </p>
          <p className="text-xl font-semibold text-slate-900">
            {formatCurrency(product.price_cash)} / {formatCurrency(product.price_web)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={searching}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {searching ? "Buscando..." : "Actualizar precios"}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Sitio</th>
              <th className="px-3 py-2 font-medium">Producto encontrado</th>
              <th className="px-3 py-2 font-medium">Precio</th>
              <th className="px-3 py-2 font-medium">Actualizado</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {initialRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-3 py-2 font-medium text-slate-900">
                  {row.site.name}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {row.matched_url ? (
                    <a
                      href={row.matched_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      {row.matched_title || "Ver producto"}
                    </a>
                  ) : (
                    row.matched_title || "—"
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {row.price !== null ? formatCurrency(row.price) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {timeAgo(row.checked_at)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status]}`}
                  >
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
              </tr>
            ))}
            {initialRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  Todavía no buscaste precios para este producto. Hacé click
                  en &quot;Actualizar precios&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
