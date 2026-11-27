"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import { outstandingBalance } from "@/lib/equipamientoSales";
import type { EquipamientoContact, EquipamientoSale } from "@/lib/types";
import { deleteSale } from "./actions";
import SaleFormModal from "./SaleFormModal";

const ROWS_PER_PAGE = 50;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function SalesTable({
  rows,
  categoryOptions,
  contacts,
}: {
  rows: EquipamientoSale[];
  categoryOptions: string[];
  contacts: EquipamientoContact[];
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [editingSale, setEditingSale] = useState<EquipamientoSale | null>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  async function handleDelete(sale: EquipamientoSale) {
    if (!confirm(`¿Eliminar la venta de "${sale.cliente}" (${sale.producto})?`)) return;
    const result = await deleteSale(sale.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-3 py-3 font-semibold">Comercio</th>
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold">Producto</th>
              <th className="px-3 py-3 font-semibold">Categoría</th>
              <th className="px-3 py-3 font-semibold">Monto</th>
              <th className="px-3 py-3 font-semibold">Método</th>
              <th className="px-3 py-3 font-semibold">Cuotas</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
              >
                <td className="overflow-hidden px-4 py-3">
                  <p className="truncate font-bold text-mh-ink">{row.cliente}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.comercio ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{formatDate(row.fecha)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink">
                  <p className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{row.producto}</span>
                    {row.comentario && (
                      <span title={row.comentario} className="shrink-0 text-mh-ink-muted">
                        <MessageSquare size={13} />
                      </span>
                    )}
                  </p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  {row.categoria ? (
                    <Badge tone="blue">{row.categoria}</Badge>
                  ) : (
                    <span className="text-mh-ink-muted">—</span>
                  )}
                </td>
                <td className="tabular-nums-mh overflow-hidden px-3 py-3 font-semibold text-mh-ink">
                  <p className="truncate">{formatCurrency(row.monto)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  {row.metodo_pago ? (
                    <Badge tone="green">{row.metodo_pago}</Badge>
                  ) : (
                    <span className="text-mh-ink-muted">—</span>
                  )}
                </td>
                <td className="overflow-hidden px-3 py-3">
                  {row.cuota_semanal && row.cuota_semanal > 0 ? (
                    <div className="min-w-[120px]">
                      <div className="h-1.5 w-full rounded-full bg-mh-border">
                        <div
                          className="h-1.5 rounded-full bg-mh-pink"
                          style={{
                            width: `${Math.min(100, ((row.monto - outstandingBalance(row)) / row.monto) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="tabular-nums-mh mt-1 truncate text-xs text-mh-ink-muted">
                        {row.semanas_pagadas} sem. · saldo {formatCurrency(outstandingBalance(row))}
                      </p>
                    </div>
                  ) : (
                    <span className="text-mh-ink-muted">Sin cuotas</span>
                  )}
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge tone={row.cobrado ? "green" : "amber"}>
                      {row.cobrado ? "Cobrado" : "Pendiente de cobro"}
                    </Badge>
                    <Badge tone={row.entregado ? "blue" : "gray"}>
                      {row.entregado ? "Entregado" : "Sin entregar"}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSale(row)}
                      className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay ventas que coincidan con los filtros.
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
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de {rows.length} venta(s)
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

      {editingSale && (
        <SaleFormModal
          sale={editingSale}
          categoryOptions={categoryOptions}
          contacts={contacts}
          onClose={() => setEditingSale(null)}
          onSaved={() => {
            setEditingSale(null);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
