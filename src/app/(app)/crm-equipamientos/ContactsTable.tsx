"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge, { type BadgeTone } from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  CONTACT_STAGES,
  type ContactCategory,
  type ContactStage,
  type EquipamientoContact,
  type EquipamientoSale,
} from "@/lib/types";
import { deleteContact, updateContact } from "./actions";
import { STAGE_LABELS, STAGE_TONE_CLASSES, suggestedWhatsAppMessage } from "./contactStages";
import { needsFollowUpToday, todayISO } from "./followUp";
import ContactDrawer from "./ContactDrawer";

const ROWS_PER_PAGE = 50;

const CATEGORY_TONE: Record<ContactCategory, BadgeTone> = {
  "Carnicería": "red",
  "Panadería": "amber",
  Restaurant: "pink",
  "Almacén": "blue",
  Supermercado: "green",
  Otro: "gray",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export type ContactRow = EquipamientoContact & {
  lastPurchaseDate: string | null;
  totalRevenue: number;
  salesCount: number;
};

export default function ContactsTable({
  rows,
  salesByContactId,
}: {
  rows: ContactRow[];
  salesByContactId: Record<string, EquipamientoSale[]>;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );
  const editingContact = rows.find((r) => r.id === editingContactId) ?? null;
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
        <table className="w-full min-w-[1480px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-3 py-3 font-semibold">Comercio</th>
              <th className="px-3 py-3 font-semibold">Ciudad</th>
              <th className="px-3 py-3 font-semibold">Teléfono</th>
              <th className="px-3 py-3 font-semibold">Rubro</th>
              <th className="px-3 py-3 font-semibold">Etapa</th>
              <th className="px-3 py-3 font-semibold">Próx. seguimiento</th>
              <th className="px-3 py-3 font-semibold">Último contacto</th>
              <th className="px-3 py-3 font-semibold">Última compra</th>
              <th className="px-3 py-3 font-semibold">Facturación total</th>
              <th className="px-3 py-3 font-semibold">Cantidad de ventas</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const dueToday = needsFollowUpToday(row, today);
              return (
                <tr
                  key={row.id}
                  onClick={() => setEditingContactId(row.id)}
                  className="cursor-pointer border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="overflow-hidden px-4 py-3">
                    <p className="truncate font-bold text-mh-ink">{row.name}</p>
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
                    <select
                      value={row.etapa}
                      disabled={savingId === row.id}
                      onChange={(e) =>
                        handleQuickEdit(row, { etapa: e.target.value as ContactStage })
                      }
                      className={`w-full rounded border border-transparent px-1.5 py-1.5 text-xs font-semibold hover:border-mh-border focus:border-mh-pink focus:outline-none ${STAGE_TONE_CLASSES[row.etapa]}`}
                    >
                      {CONTACT_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="overflow-hidden px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={row.proximo_seguimiento ?? ""}
                      disabled={savingId === row.id}
                      onChange={(e) =>
                        handleQuickEdit(row, { proximo_seguimiento: e.target.value || null })
                      }
                      className={`w-full rounded border border-transparent px-1.5 py-1.5 text-xs hover:border-mh-border focus:border-mh-pink focus:outline-none ${
                        dueToday ? "bg-amber-50 font-semibold text-amber-700" : ""
                      }`}
                    />
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{formatDate(row.last_contact_date)}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{formatDate(row.lastPurchaseDate)}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 font-semibold text-mh-ink">
                    <p className="truncate">{formatCurrency(row.totalRevenue)}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{row.salesCount}</p>
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
                          onClick={() => {
                            setEditingContactId(row.id);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-mh-ink hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>
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
                <td colSpan={12} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay contactos que coincidan con los filtros.
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
            {Math.min(currentPage * ROWS_PER_PAGE, rows.length)} de {rows.length} contacto(s)
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

      <ContactDrawer
        key={editingContact?.id ?? "none"}
        contact={editingContact}
        sales={editingContact ? (salesByContactId[editingContact.id] ?? []) : []}
        onClose={() => setEditingContactId(null)}
        onDeleted={() => router.refresh()}
      />
    </Card>
  );
}
