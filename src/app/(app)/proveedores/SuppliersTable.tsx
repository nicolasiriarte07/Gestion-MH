"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
import { formatCurrency } from "@/lib/currency";
import type { Supplier } from "@/lib/types";
import { deleteSupplier } from "./actions";
import SupplierDrawer from "./SupplierDrawer";

export type SupplierRow = Supplier & {
  balance: number;
  last_purchase_date: string | null;
  brandNames: string[];
  totalPurchased: number;
};

const ROWS_PER_PAGE = 50;

function priceListHref(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export default function SuppliersTable({ rows }: { rows: SupplierRow[] }) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierRow | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const allPageSelected = pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id));

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedRows.forEach((r) => next.delete(r.id));
      } else {
        pagedRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteOne(row: SupplierRow) {
    if (!confirm(`¿Eliminar el proveedor "${row.trade_name}"?`)) return;
    const result = await deleteSupplier(row.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    setOpenMenuId(null);
    setViewingSupplier(null);
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} proveedor(es) seleccionado(s)?`)) return;
    setDeleting(true);
    const ids = [...selectedIds];
    const results = await Promise.all(ids.map((id) => deleteSupplier(id)));
    const failed = results.filter((r) => r.error).length;
    setSelectedIds(new Set());
    setDeleting(false);
    if (failed > 0) alert(`${failed} proveedor(es) no se pudieron eliminar.`);
  }

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-mh-border px-6 py-3">
          <span className="text-sm font-semibold text-mh-pink">
            {selectedIds.size} seleccionado(s)
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg border border-mh-border px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      )}

      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="w-11 px-4 py-3">
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                />
              </th>
              <th className="w-14 px-2 py-3" />
              <th className="px-3 py-3 font-semibold">Proveedor</th>
              <th className="px-3 py-3 font-semibold">CUIT</th>
              <th className="px-3 py-3 font-semibold">Ciudad</th>
              <th className="px-3 py-3 font-semibold">Teléfono</th>
              <th className="px-3 py-3 font-semibold">Email</th>
              <th className="px-3 py-3 font-semibold">Lista</th>
              <th className="px-3 py-3 font-semibold">Compras acum.</th>
              <th className="px-3 py-3 font-semibold">Saldo</th>
              <th className="px-3 py-3 font-semibold">Última compra</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setViewingSupplier(row)}
                className="cursor-pointer border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="accent-mh-pink"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Avatar name={row.trade_name} size={36} />
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <p className="truncate font-bold text-mh-ink">{row.trade_name}</p>
                  <p className="truncate text-xs text-mh-ink-muted">
                    {row.legal_name ?? "Sin razón social"}
                  </p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.cuit ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.city ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.phone ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.email ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  {row.price_list ? (
                    <a
                      href={priceListHref(row.price_list)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={row.price_list}
                      className="flex items-center gap-1.5 text-xs font-bold text-mh-pink hover:underline"
                    >
                      <ExternalLink size={13} />
                      Ver lista
                    </a>
                  ) : (
                    <span className="text-mh-ink-muted">—</span>
                  )}
                </td>
                <td className="overflow-hidden px-3 py-3 font-medium text-mh-ink">
                  <p className="truncate">{formatCurrency(row.totalPurchased)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <p className={`truncate font-bold ${row.balance > 0 ? "text-red-600" : "text-mh-ink"}`}>
                    {formatCurrency(row.balance)}
                  </p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{row.last_purchase_date ?? "—"}</p>
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <Badge tone={row.is_active ? "green" : "gray"}>
                    {row.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="relative px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenuId((id) => (id === row.id ? null : row.id))}
                    className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenuId === row.id && (
                    <div
                      ref={menuRef}
                      className="absolute top-full right-3 z-20 w-40 rounded-xl border border-mh-border bg-white py-1 shadow-lg"
                    >
                      <Link
                        href={`/proveedores/${row.id}/editar`}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-mh-ink hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDeleteOne(row)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-slate-50"
                      >
                        <Trash2 size={15} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay proveedores que coincidan con los filtros.
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
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de {rows.length} proveedor(es)
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

      <SupplierDrawer supplier={viewingSupplier} onClose={() => setViewingSupplier(null)} />
    </Card>
  );
}
