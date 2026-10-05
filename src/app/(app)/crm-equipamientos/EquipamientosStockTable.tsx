"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/lib/types";
import { stockTone, stockLabel } from "../inventario/stockStatus";

const ROWS_PER_PAGE = 50;

export default function EquipamientosStockTable({
  rows,
  brandName,
  categoryName,
}: {
  rows: Product[];
  brandName: (id: string | null) => string;
  categoryName: (id: string | null) => string;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-3 py-3 font-semibold">Marca</th>
              <th className="px-3 py-3 font-semibold">Categoría</th>
              <th className="px-3 py-3 font-semibold">Stock</th>
              <th className="px-3 py-3 font-semibold">P.Contado</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-mh-border/70 last:border-0 hover:bg-mh-bg"
              >
                <td className="overflow-hidden px-4 py-3">
                  <p className="truncate font-bold text-mh-ink">{p.description}</p>
                  <p className="truncate text-xs text-mh-ink-muted">{p.sku}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{brandName(p.brand_id) || "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{categoryName(p.category_id) || "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 font-bold text-mh-ink">{p.stock}</td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink">
                  <p className="truncate">{formatCurrency(p.price_cash)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <Badge tone={stockTone(p.stock)}>{stockLabel(p.stock)}</Badge>
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay productos de EQUIPAMIENTOS MH cargados en Inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mh-border px-6 py-4 text-sm text-mh-ink-muted">
          <span>
            Mostrando {(currentPage - 1) * ROWS_PER_PAGE + 1}–
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de {rows.length} producto(s)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-sm font-semibold text-mh-ink">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
