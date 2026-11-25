"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, PhoneCall, Trash2 } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  CONTACT_CATEGORIES,
  CONTACT_STAGES,
  type ContactCategory,
  type ContactStage,
  type EquipamientoContact,
  type EquipamientoSale,
} from "@/lib/types";
import { deleteContact, updateContact, type ContactInput } from "./actions";
import { STAGE_LABELS, STAGE_TONE_CLASSES, formatDateDMY, suggestedWhatsAppMessage } from "./contactStages";
import { addDaysISO, daysBetweenISO, isOverdue, todayISO } from "./followUp";

const inputClass =
  "font-inter w-full rounded-xl border border-mh-border px-3 py-2 text-sm text-mh-ink focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";
const STALE_PURCHASE_DAYS = 90;

// Mismo patrón de autosave por campo que MarketingItemDrawer: inputs no
// controlados (defaultValue) que guardan en onBlur/onChange, salvo
// próximo_seguimiento, que sí es controlado porque "Contactado hoy" lo
// tiene que poder pisar con un valor propuesto.
export default function ContactDrawer({
  contact,
  sales,
  onClose,
  onDeleted,
}: {
  contact: EquipamientoContact | null;
  sales: EquipamientoSale[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proximoSeguimiento, setProximoSeguimiento] = useState(
    contact?.proximo_seguimiento ?? ""
  );

  async function saveField(patch: Partial<ContactInput>) {
    if (!contact) return;
    setSaving(true);
    setError(null);
    const result = await updateContact(contact.id, patch);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleContactedToday() {
    if (!contact) return;
    const today = todayISO();
    const nextFollowUp = addDaysISO(today, 7);
    setProximoSeguimiento(nextFollowUp);
    await saveField({ last_contact_date: today, proximo_seguimiento: nextFollowUp });
  }

  async function handleDelete() {
    if (!contact) return;
    if (!confirm(`¿Eliminar el contacto "${contact.name}"?`)) return;
    setDeleting(true);
    const result = await deleteContact(contact.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDeleted();
    onClose();
  }

  const today = todayISO();
  const overdue = contact ? isOverdue(contact, today) : false;

  return (
    <Drawer open={contact !== null} onClose={onClose}>
      {contact && (
        <>
          <div className="border-b border-mh-border p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="pink">{contact.category}</Badge>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STAGE_TONE_CLASSES[contact.etapa]}`}
              >
                {STAGE_LABELS[contact.etapa]}
              </span>
              {overdue && <Badge tone="red">Seguimiento vencido</Badge>}
            </div>
            <p className="mt-2 text-lg font-extrabold text-mh-ink">{contact.name}</p>
            {contact.business_name && (
              <p className="text-sm text-mh-ink-muted">{contact.business_name}</p>
            )}
          </div>

          <div className="flex-1 space-y-4 p-6">
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {contact.phone && (
                <a
                  href={buildWhatsAppLink(contact.phone, suggestedWhatsAppMessage(contact))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              <button
                onClick={handleContactedToday}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl border border-mh-border px-3 py-2 text-sm font-semibold text-mh-ink hover:bg-slate-50 disabled:opacity-50"
              >
                <PhoneCall size={16} />
                Contactado hoy
              </button>
            </div>

            <label className="block">
              <span className={labelClass}>Nombre</span>
              <input
                className={inputClass}
                defaultValue={contact.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== contact.name) saveField({ name: v });
                }}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Comercio</span>
                <input
                  className={inputClass}
                  defaultValue={contact.business_name ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (contact.business_name ?? "")) saveField({ business_name: v || null });
                  }}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Ciudad</span>
                <input
                  className={inputClass}
                  defaultValue={contact.city ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (contact.city ?? "")) saveField({ city: v || null });
                  }}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Teléfono</span>
              <input
                className={inputClass}
                defaultValue={contact.phone ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (contact.phone ?? "")) saveField({ phone: v || null });
                }}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Rubro</span>
                <select
                  className={inputClass}
                  defaultValue={contact.category}
                  onChange={(e) => saveField({ category: e.target.value as ContactCategory })}
                >
                  {CONTACT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Etapa</span>
                <select
                  className={inputClass}
                  defaultValue={contact.etapa}
                  onChange={(e) => saveField({ etapa: e.target.value as ContactStage })}
                >
                  {CONTACT_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Equipo de interés</span>
              <input
                className={inputClass}
                placeholder="Ej: freezer exhibidor 400L"
                defaultValue={contact.equipo_interes ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (contact.equipo_interes ?? "")) saveField({ equipo_interes: v || null });
                }}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Último contacto</span>
                <input
                  type="date"
                  className={inputClass}
                  defaultValue={contact.last_contact_date ?? ""}
                  onChange={(e) => saveField({ last_contact_date: e.target.value || null })}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Próximo seguimiento</span>
                <input
                  type="date"
                  className={`${inputClass} ${overdue ? "border-red-400 bg-red-50" : ""}`}
                  value={proximoSeguimiento ?? ""}
                  onChange={(e) => {
                    setProximoSeguimiento(e.target.value);
                    saveField({ proximo_seguimiento: e.target.value || null });
                  }}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Notas de seguimiento</span>
              <textarea
                className={inputClass}
                rows={3}
                defaultValue={contact.notas_seguimiento ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v === (contact.notas_seguimiento ?? "")) return;
                  // Guardar una nota cuenta como una interacción: actualiza
                  // "último contacto" a hoy en el mismo guardado.
                  saveField({ notas_seguimiento: v || null, last_contact_date: todayISO() });
                }}
              />
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-mh-ink">Compras</p>
                {contact.etapa === "cliente" &&
                  (() => {
                    const daysSince = sales[0]?.fecha
                      ? daysBetweenISO(sales[0].fecha, today)
                      : null;
                    const stale = daysSince === null || daysSince > STALE_PURCHASE_DAYS;
                    if (!stale) return null;
                    return (
                      <Badge tone="amber">
                        {daysSince === null ? "Sin compras" : `${daysSince} días sin comprar`}
                      </Badge>
                    );
                  })()}
              </div>
              {sales.length === 0 ? (
                <p className="text-sm text-mh-ink-muted">Sin compras registradas.</p>
              ) : (
                <div className="space-y-1.5">
                  {sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="rounded-xl border border-mh-border px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-mh-ink">{sale.producto}</p>
                        <p className="font-bold text-mh-ink">{formatCurrency(sale.monto)}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-mh-ink-muted">
                        <span>{formatDateDMY(sale.fecha)}</span>
                        <Badge tone={sale.cobrado ? "green" : "amber"}>
                          {sale.cobrado ? "Cobrado" : "Pendiente de cobro"}
                        </Badge>
                        <Badge tone={sale.entregado ? "green" : "amber"}>
                          {sale.entregado ? "Entregado" : "Pendiente de entrega"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-mh-border p-6">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Eliminar contacto
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
