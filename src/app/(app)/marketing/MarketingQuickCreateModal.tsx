"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import type { BusinessUnit } from "@/lib/types";
import { createMarketingPost } from "./actions";
import { createAdCampaign } from "./pauta-actions";
import { todayISO } from "./normalize";

const inputClass =
  "font-inter w-full rounded-xl border border-mh-border px-3 py-2 text-sm text-mh-ink focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-mh-ink";

// Mismos campos mínimos que ya pedía la fila "borrador" de la tabla
// Orgánico/Pauta (ver MarketingCalendar.tsx/PautaCalendar.tsx), acá
// como modal para poder crear desde el Calendario/Agenda/Kanban, que no
// tienen una tabla donde agregar una fila.
export default function MarketingQuickCreateModal({
  kind,
  businessUnits,
  onClose,
}: {
  kind: "post" | "campaign";
  businessUnits: BusinessUnit[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [businessUnitId, setBusinessUnitId] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setError(kind === "post" ? "El concepto es obligatorio." : "El nombre de la campaña es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);

    const result =
      kind === "post"
        ? await createMarketingPost({
            concept: name.trim(),
            description: null,
            business_unit_id: businessUnitId || null,
            publish_date: date,
            content_type: null,
            is_scheduled: false,
            is_published: false,
            investment_ars: 0,
          })
        : await createAdCampaign({
            campaign_name: name.trim(),
            investment_ars: 0,
            reach: 0,
            start_date: date,
            end_date: date,
          });

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal title={kind === "post" ? "Nueva publicación" : "Nueva campaña"} onClose={onClose}>
      <div className="font-inter space-y-3">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
        )}
        <label className="block">
          <span className={labelClass}>{kind === "post" ? "Concepto" : "Nombre de la campaña"}</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        {kind === "post" && (
          <label className="block">
            <span className={labelClass}>Vertical</span>
            <select
              className={inputClass}
              value={businessUnitId}
              onChange={(e) => setBusinessUnitId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {businessUnits.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className={labelClass}>{kind === "post" ? "Fecha de publicación" : "Fecha de inicio"}</span>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
