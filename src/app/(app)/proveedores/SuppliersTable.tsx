"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Supplier } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { deleteSupplier } from "./actions";

export type SupplierRow = Supplier & {
  balance: number;
  last_purchase_date: string | null;
  brandNames: string[];
};

const ROWS_PER_PAGE = 50;

const COLUMNS = [
  { key: "trade_name", label: "Nombre", width: 180 },
  { key: "legal_name", label: "Razón Social", width: 160 },
  { key: "cuit", label: "CUIT", width: 130 },
  { key: "category", label: "Categoría", width: 140 },
  { key: "brands", label: "Marca(s)", width: 160 },
  { key: "phone", label: "Teléfono", width: 120 },
  { key: "email", label: "Email", width: 180 },
  { key: "city", label: "Ciudad", width: 120 },
  { key: "balance", label: "Saldo", width: 120 },
  { key: "status", label: "Estado", width: 90 },
  { key: "last_purchase", label: "Última compra", width: 120 },
  { key: "actions", label: "", width: 130 },
] as const;

const totalWidth = COLUMNS.reduce((sum, c) => sum + c.width, 0);

export default function SuppliersTable({ rows }: { rows: SupplierRow[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  async function handleDelete(e: React.MouseEvent, row: SupplierRow) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar el proveedor "${row.trade_name}"?`)) return;

    setDeletingId(row.id);
    const result = await deleteSupplier(row.id);
    setDeletingId(null);

    if (result.error) {
      alert(result.error);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table
        className="text-xs"
        style={{ tableLayout: "fixed", width: totalWidth }}
      >
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => (
            <tr
              key={row.id}
              onClick={() => router.push(`/proveedores/${row.id}`)}
              className="cursor-pointer border-b border-slate-100 align-top last:border-0 hover:bg-slate-50"
            >
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate font-medium text-slate-900">
                  {row.trade_name}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.legal_name ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">{row.cuit ?? "—"}</div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.category ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.brandNames.length > 0 ? row.brandNames.join(", ") : "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.phone ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.email ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.city ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div
                  className={`truncate font-medium ${row.balance > 0 ? "text-red-600" : "text-slate-600"}`}
                >
                  {formatCurrency(row.balance)}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div className="truncate text-slate-600">
                  {row.last_purchase_date ?? "—"}
                </div>
              </td>
              <td className="overflow-hidden px-3 py-2">
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/proveedores/${row.id}/editar`}
                    className="rounded px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={(e) => handleDelete(e, row)}
                    disabled={deletingId === row.id}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-3 py-8 text-center text-slate-400"
              >
                No hay proveedores que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
          <span>
            Mostrando {(currentPage - 1) * ROWS_PER_PAGE + 1}–
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de{" "}
            {rows.length} proveedor(es)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
