"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { CONTACT_CATEGORIES, type EquipamientoContact } from "@/lib/types";
import { createContact, updateContact, type ContactInput } from "./actions";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

function emptyInput(): ContactInput {
  return {
    name: "",
    business_name: null,
    city: null,
    phone: null,
    category: "Otro",
    last_contact_date: null,
  };
}

export default function ContactFormModal({
  contact,
  onClose,
  onSaved,
}: {
  contact: EquipamientoContact | null;
  onClose: () => void;
  onSaved: (contact: EquipamientoContact) => void;
}) {
  const [form, setForm] = useState<ContactInput>(
    contact
      ? {
          name: contact.name,
          business_name: contact.business_name,
          city: contact.city,
          phone: contact.phone,
          category: contact.category,
          last_contact_date: contact.last_contact_date,
        }
      : emptyInput()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(fields: Partial<ContactInput>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = contact
      ? await updateContact(contact.id, form)
      : await createContact(form);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result.data as EquipamientoContact);
  }

  return (
    <Modal title={contact ? "Editar contacto" : "Nuevo contacto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            autoFocus
            className={inputClass}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>Comercio</label>
          <input
            className={inputClass}
            value={form.business_name ?? ""}
            onChange={(e) => patch({ business_name: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              className={inputClass}
              value={form.city ?? ""}
              onChange={(e) => patch({ city: e.target.value || null })}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              className={inputClass}
              value={form.phone ?? ""}
              onChange={(e) => patch({ phone: e.target.value || null })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Rubro</label>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) =>
                patch({ category: e.target.value as ContactInput["category"] })
              }
            >
              {CONTACT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Último contacto</label>
            <input
              type="date"
              className={inputClass}
              value={form.last_contact_date ?? ""}
              onChange={(e) => patch({ last_contact_date: e.target.value || null })}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-mh-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-mh-ink-muted hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
