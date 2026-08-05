"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
import { formatCurrency } from "@/lib/currency";
import type { ClienteRow, ClienteStatus } from "./aggregate";
import { clienteStatusLabel, clienteStatusTone } from "./clienteStatus";
import ClienteDrawer from "./ClienteDrawer";

export type ClienteTableRow = ClienteRow & { status: ClienteStatus };

const ROWS_PER_PAGE = 50;

export default function ClientesTable({
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  rows: ClienteTableRow[];
  selectedIds: Set<string>;
  onToggleSelect: (name: string) => void;
  onToggleSelectAll: (names: string[]) => void;
}) {
  const [page, setPage] = useState(1);
  const [viewingCliente, setViewingCliente] = useState<ClienteTableRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const allPageSelected =
    pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.customer_name));

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="w-11 px-4 py-3">
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  checked={allPageSelected}
                  onChange={() => onToggleSelectAll(pagedRows.map((r) => r.customer_name))}
                />
              </th>
              <th className="w-14 px-2 py-3" />
              <th className="px-3 py-3 font-semibold">Cliente</th>
              <th className="px-3 py-3 font-semibold">Última compra</th>
              <th className="px-3 py-3 font-semibold">Compras</th>
              <th className="px-3 py-3 font-semibold">Facturación</th>
              <th className="px-3 py-3 font-semibold">Ticket promedio</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr
                key={row.customer_name}
                onClick={() => setViewingCliente(row)}
                className="cursor-pointer border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="accent-mh-pink"
                    checked={selectedIds.has(row.customer_name)}
                    onChange={() => onToggleSelect(row.customer_name)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Avatar name={row.customer_name} size={36} />
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <p className="truncate font-bold text-mh-ink">{row.customer_name}</p>
                  <p className="truncate text-xs text-mh-ink-muted">
                    Cliente desde {row.first_sale_date}
                  </p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.last_sale_date}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink">
                  <p className="truncate">{row.visit_count}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 font-bold text-mh-ink">
                  <p className="truncate">{formatCurrency(row.total_ars)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">
                    {formatCurrency(row.line_count > 0 ? row.total_ars / row.line_count : 0)}
                  </p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <Badge tone={clienteStatusTone(row.status)}>
                    {clienteStatusLabel(row.status)}
                  </Badge>
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay clientes que coincidan con los filtros.
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
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de {rows.length} cliente(s)
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

      <ClienteDrawer cliente={viewingCliente} onClose={() => setViewingCliente(null)} />
    </Card>
  );
}
