"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import Avatar from "@/components/ds/Avatar";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ContactRow } from "./contactRow";
import { formatDateDMY, suggestedWhatsAppMessage, withLostReasonNote } from "./contactStages";
import { followUpLight, isOverdue, todayISO, FOLLOW_UP_LIGHT_DOT_CLASSES } from "./followUp";
import { updateContact } from "./actions";
import LostReasonModal from "./LostReasonModal";

const fieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs hover:border-mh-border focus:border-mh-pink focus:bg-white focus:outline-none";

export default function LeadCard({
  contact,
  onOpenContact,
}: {
  contact: ContactRow;
  onOpenContact: (id: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const today = todayISO();
  const overdue = isOverdue(contact, today);
  const light = followUpLight(contact, today);

  async function saveField(patch: Record<string, unknown>) {
    setSaving(true);
    const result = await updateContact(contact.id, patch);
    setSaving(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleWonClient() {
    await saveField({ etapa: "cliente" });
  }

  async function handleLostConfirm(motivo: string) {
    setShowLostModal(false);
    await saveField({
      etapa: "perdido",
      notas_seguimiento: withLostReasonNote(contact.notas_seguimiento, motivo),
      last_contact_date: today,
    });
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", contact.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpenContact(contact.id)}
      className="cursor-grab space-y-2 rounded-xl border border-mh-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-mh-pink/40 active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <Avatar name={contact.name || contact.business_name || "?"} size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-mh-ink">{contact.name}</p>
          {contact.city && (
            <p className="flex items-center gap-1 truncate text-xs text-mh-ink-muted">
              <MapPin size={11} />
              {contact.city}
            </p>
          )}
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <input
          className={fieldClass}
          placeholder="Equipo de interés..."
          defaultValue={contact.equipo_interes ?? ""}
          disabled={saving}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (contact.equipo_interes ?? "")) saveField({ equipo_interes: v || null });
          }}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <AutoGrowTextarea
          className={fieldClass}
          defaultValue={contact.notas_seguimiento ?? ""}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v === (contact.notas_seguimiento ?? "")) return;
            saveField({ notas_seguimiento: v || null, last_contact_date: todayISO() });
          }}
        />
      </div>

      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {light && (
          <span
            title={overdue ? "Vencido" : "Próximo seguimiento"}
            className={`h-2 w-2 shrink-0 rounded-full ${FOLLOW_UP_LIGHT_DOT_CLASSES[light]}`}
          />
        )}
        <input
          type="date"
          value={contact.proximo_seguimiento ?? ""}
          disabled={saving}
          onChange={(e) => saveField({ proximo_seguimiento: e.target.value || null })}
          className={`${fieldClass} ${overdue ? "font-semibold text-red-600" : ""}`}
        />
      </div>

      <div className="flex items-center gap-1.5 border-t border-mh-border/70 pt-2" onClick={(e) => e.stopPropagation()}>
        {contact.phone && (
          <a
            href={buildWhatsAppLink(contact.phone, suggestedWhatsAppMessage(contact))}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
          >
            <MessageCircle size={14} />
          </a>
        )}
        <button
          title="Pasó a cliente"
          disabled={saving}
          onClick={handleWonClient}
          className="rounded-lg bg-mh-blue-light p-1.5 text-mh-blue hover:bg-mh-blue/20 disabled:opacity-50"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          title="Perdido"
          disabled={saving}
          onClick={() => setShowLostModal(true)}
          className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          <ThumbsDown size={14} />
        </button>
        {overdue && (
          <span className="ml-auto text-[11px] font-semibold text-red-600">
            Vencido {formatDateDMY(contact.proximo_seguimiento)}
          </span>
        )}
      </div>

      {showLostModal && (
        <LostReasonModal
          contactName={contact.name}
          onClose={() => setShowLostModal(false)}
          onConfirm={handleLostConfirm}
        />
      )}
    </div>
  );
}
