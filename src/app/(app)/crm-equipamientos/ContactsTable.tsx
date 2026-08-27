"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge, { type BadgeTone } from "@/components/ds/Badge";
import type { ContactCategory, EquipamientoContact } from "@/lib/types";
import { deleteContact } from "./actions";
import ContactFormModal from "./ContactFormModal";

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

export type ContactRow = EquipamientoContact & { lastPurchaseDate: string | null };

export default function ContactsTable({ rows }: { rows: ContactRow[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<EquipamientoContact | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

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
        <table className="w-full min-w-[980px] text-sm">
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-3 py-3 font-semibold">Comercio</th>
              <th className="px-3 py-3 font-semibold">Ciudad</th>
              <th className="px-3 py-3 font-semibold">Teléfono</th>
              <th className="px-3 py-3 font-semibold">Rubro</th>
              <th className="px-3 py-3 font-semibold">Último contacto</th>
              <th className="px-3 py-3 font-semibold">Última compra</th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setEditingContact(row)}
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
                      href={`tel:${row.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 truncate hover:text-mh-pink"
                    >
                      <Phone size={13} />
                      {row.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="overflow-hidden px-3 py-3">
                  <Badge tone={CATEGORY_TONE[row.category]}>{row.category}</Badge>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{formatDate(row.last_contact_date)}</p>
                </td>
                <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                  <p className="truncate">{formatDate(row.lastPurchaseDate)}</p>
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
                          setEditingContact(row);
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
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-mh-ink-muted">
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

      {editingContact && (
        <ContactFormModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() => {
            setEditingContact(null);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
