"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { EquipamientoContact } from "@/lib/types";
import ContactFormModal from "../crm-equipamientos/ContactFormModal";

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Combobox de contacto: igual criterio que el buscador de productos de
// Compras (NewPurchaseOrderModal) — es un input de texto libre con
// sugerencias; escribir sin elegir una no bloquea nada (contactId queda
// en null y displayName se usa tal cual como "cliente"), pero elegir
// una sugerencia o crear un contacto nuevo deja todo vinculado.
export default function ContactPicker({
  contacts,
  contactId,
  displayName,
  onChangeDisplayName,
  onSelectContact,
  autoFocus,
}: {
  contacts: EquipamientoContact[];
  contactId: string | null;
  displayName: string;
  onChangeDisplayName: (name: string) => void;
  onSelectContact: (contact: EquipamientoContact) => void;
  autoFocus?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  const needle = displayName.trim().toLowerCase();
  const needleDigits = normalizeDigits(displayName);
  const matches = needle
    ? contacts
        .filter(
          (c) =>
            c.name.toLowerCase().includes(needle) ||
            (c.business_name ?? "").toLowerCase().includes(needle) ||
            (needleDigits.length >= 4 &&
              !!c.phone &&
              normalizeDigits(c.phone).includes(needleDigits))
        )
        .slice(0, 8)
    : [];

  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
        placeholder="Buscar por nombre, comercio o teléfono..."
        value={displayName}
        onChange={(e) => onChangeDisplayName(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />
      {contactId && (
        <p className="mt-1 text-xs font-medium text-emerald-600">✓ Contacto vinculado</p>
      )}

      {showDropdown && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-mh-border bg-white py-1 shadow-lg">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelectContact(c);
                setShowDropdown(false);
              }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-semibold text-mh-ink">{c.name}</span>
              <span className="text-xs text-mh-ink-muted">
                {[c.business_name, c.city, c.phone].filter(Boolean).join(" · ") || "Sin datos"}
              </span>
            </button>
          ))}
          {needle && matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-mh-ink-muted">Sin contactos que coincidan.</p>
          )}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-1.5 border-t border-mh-border px-3 py-2 text-left text-sm font-semibold text-mh-pink hover:bg-mh-pink-light/30"
          >
            <UserPlus size={14} />
            Crear contacto nuevo{displayName.trim() ? `: "${displayName.trim()}"` : ""}
          </button>
        </div>
      )}

      {creating && (
        <ContactFormModal
          initialName={displayName.trim()}
          onClose={() => setCreating(false)}
          onSaved={(contact) => {
            setCreating(false);
            onSelectContact(contact);
          }}
        />
      )}
    </div>
  );
}
