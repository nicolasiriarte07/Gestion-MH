"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Card from "@/components/ds/Card";
import Badge, { type BadgeTone } from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import { formatCurrency } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ContactCategory, EquipamientoContact } from "@/lib/types";
import { deleteContact, updateContact } from "./actions";
import { formatDateDMY, suggestedWhatsAppMessage } from "./contactStages";
import { daysBetweenISO, isOverdue, todayISO } from "./followUp";
import type { ContactRow } from "./contactRow";

const ROWS_PER_PAGE = 50;
const STALE_PURCHASE_DAYS = 90;

const CATEGORY_TONE: Record<ContactCategory, BadgeTone> = {
  "Carnicería": "red",
  "Panadería": "amber",
  Restaurant: "pink",
  "Almacén": "blue",
  Supermercado: "green",
  Otro: "gray",
};

const fieldClass =
  "w-full rounded border border-transparent px-1.5 py-1.5 text-xs hover:border-mh-border focus:border-mh-pink focus:outline-none";

export default function ClientsTable({
  rows,
  onOpenContact,
}: {
  rows: ContactRow[];
  onOpenContact: (id: string) => void;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [balanceSort, setBalanceSort] = useState<"asc" | "desc" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sortedRows = useMemo(() => {
    if (!balanceSort) return rows;
    const sorted = [...rows].sort((a, b) => a.outstandingBalance - b.outstandingBalance);
    return balanceSort === "desc" ? sorted.reverse() : sorted;
  }, [rows, balanceSort]);

  function toggleBalanceSort() {
    setBalanceSort((prev) => (prev === "desc" ? "asc" : prev === "asc" ? null : "desc"));
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );
  const today = todayISO();

  async function handleQuickEdit(row: ContactRow, patch: Record<string, unknown>) {
    setSavingId(row.id);
    const result = await updateContact(row.id, patch);
    setSavingId(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(contact: EquipamientoContact) {
    if (!confirm(`¿Eliminar el contacto "${contact.name}"?`)) return;
    const result = await deleteContact(contact.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    setOpenMenuId(null);
    router.refresh();
  }

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1850px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-3 py-3 font-semibold">Comercio</th>
              <th className="px-3 py-3 font-semibold">Ciudad</th>
              <th className="px-3 py-3 font-semibold">Teléfono</th>
              <th className="px-3 py-3 font-semibold">Rubro</th>
              <th className="px-3 py-3 font-semibold">Equipo de interés</th>
              <th className="px-3 py-3 font-semibold">Última compra</th>
              <th className="px-3 py-3 font-semibold">Días s/compra</th>
              <th className="px-3 py-3 font-semibold">Facturación total</th>
              <th className="px-3 py-3 font-semibold">Cant. ventas</th>
              <th className="px-3 py-3 font-semibold">
                <button
                  onClick={toggleBalanceSort}
                  className="flex items-center gap-1 uppercase hover:text-mh-ink"
                >
                  Saldo pendiente
                  {balanceSort === "asc" ? (
                    <ArrowUp size={12} />
                  ) : balanceSort === "desc" ? (
                    <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-50" />
                  )}
                </button>
              </th>
              <th className="px-3 py-3 font-semibold">Próx. seguimiento</th>
              <th className="px-3 py-3 font-semibold">Nota</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const daysSincePurchase = row.lastPurchaseDate
                ? daysBetweenISO(row.lastPurchaseDate, today)
                : null;
              const stale = daysSincePurchase === null || daysSincePurchase > STALE_PURCHASE_DAYS;
              const overdue = isOverdue(row, today);

              return (
                <tr
                  key={row.id}
                  onClick={() => onOpenContact(row.id)}
                  className="cursor-pointer border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="overflow-hidden px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.name || row.business_name || "?"} size={28} />
                      <p className="truncate font-bold text-mh-ink">{row.name}</p>
                    </div>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{row.business_name ?? "—"}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{row.city ?? "—"}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    {row.phone ? (
                      <a
                        href={buildWhatsAppLink(row.phone, suggestedWhatsAppMessage(row))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir WhatsApp"
                        className="flex items-center gap-1.5 truncate hover:text-emerald-600"
                      >
                        <MessageCircle size={13} />
                        {row.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="overflow-hidden px-3 py-3">
                    <Badge tone={CATEGORY_TONE[row.category]}>{row.category}</Badge>
                  </td>
                  <td className="overflow-hidden px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      className={fieldClass}
                      defaultValue={row.equipo_interes ?? ""}
                      disabled={savingId === row.id}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (row.equipo_interes ?? "")) {
                          handleQuickEdit(row, { equipo_interes: v || null });
                        }
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{formatDateDMY(row.lastPurchaseDate)}</p>
                  </td>
                  <td className="tabular-nums-mh overflow-hidden px-3 py-3">
                    {daysSincePurchase === null ? (
                      <Badge tone="amber">Sin compras</Badge>
                    ) : stale ? (
                      <Badge tone="amber">{daysSincePurchase} días</Badge>
                    ) : (
                      <p className="text-mh-ink-muted">{daysSincePurchase} días</p>
                    )}
                  </td>
                  <td className="tabular-nums-mh overflow-hidden px-3 py-3 font-semibold text-mh-ink">
                    <p className="truncate">{formatCurrency(row.totalRevenue)}</p>
                  </td>
                  <td className="tabular-nums-mh overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{row.salesCount}</p>
                  </td>
                  <td className="tabular-nums-mh overflow-hidden px-3 py-3">
                    {row.outstandingBalance > 0 ? (
                      <p className="truncate font-semibold text-amber-700">
                        {formatCurrency(row.outstandingBalance)}
                      </p>
                    ) : (
                      <p className="text-mh-ink-muted">—</p>
                    )}
                  </td>
                  <td className="overflow-hidden px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={row.proximo_seguimiento ?? ""}
                      disabled={savingId === row.id}
                      onChange={(e) =>
                        handleQuickEdit(row, { proximo_seguimiento: e.target.value || null })
                      }
                      className={`${fieldClass} ${overdue ? "bg-red-50 font-semibold text-red-600" : ""}`}
                    />
                  </td>
                  <td className="overflow-hidden px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <AutoGrowTextarea
                      className={fieldClass}
                      defaultValue={row.notas_seguimiento ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (row.notas_seguimiento ?? "")) {
                          handleQuickEdit(row, {
                            notas_seguimiento: v || null,
                            last_contact_date: todayISO(),
                          });
                        }
                      }}
                    />
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
                        <button
                          onClick={() => handleDelete(row)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-slate-50"
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={14} className="px-6 py-16 text-center text-mh-ink-muted">
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
    </Card>
  );
}
