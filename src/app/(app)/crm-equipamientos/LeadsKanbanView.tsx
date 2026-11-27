"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactStage } from "@/lib/types";
import type { ContactRow } from "./contactRow";
import { STAGE_LABELS, withLostReasonNote } from "./contactStages";
import { todayISO } from "./followUp";
import { updateContact } from "./actions";
import LeadCard from "./LeadCard";
import LostReasonModal from "./LostReasonModal";

const KANBAN_STAGES: ContactStage[] = ["lead", "contactado", "cotizado"];
const LOST_PAGE_SIZE = 5;

const COLUMN_HEADER_CLASSES: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700",
  contactado: "bg-mh-blue-light text-mh-blue",
  cotizado: "bg-amber-100 text-amber-700",
  perdido: "bg-red-100 text-red-700",
};

// Drag & drop nativo (sin librería): cada LeadCard es "draggable" y
// pone su id en dataTransfer; cada columna acepta el drop y actualiza
// la etapa. Soltar en "Perdido" pide el motivo (mismo flujo que el
// botón de la tarjeta) antes de mover. "Perdido" arranca colapsado:
// muestra solo los primeros 5 y un botón para ver el resto.
export default function LeadsKanbanView({
  rows,
  lostRows,
  onOpenContact,
}: {
  rows: ContactRow[];
  lostRows: ContactRow[];
  onOpenContact: (id: string) => void;
}) {
  const router = useRouter();
  const [dragOverStage, setDragOverStage] = useState<ContactStage | null>(null);
  const [lostExpanded, setLostExpanded] = useState(false);
  const [pendingLostId, setPendingLostId] = useState<string | null>(null);

  const allRows = [...rows, ...lostRows];

  function rowsByStage(stage: ContactStage): ContactRow[] {
    return rows
      .filter((r) => r.etapa === stage)
      .sort((a, b) =>
        (a.proximo_seguimiento ?? "9999-99-99").localeCompare(
          b.proximo_seguimiento ?? "9999-99-99"
        )
      );
  }

  const lostSorted = [...lostRows].sort((a, b) =>
    (b.last_contact_date ?? "").localeCompare(a.last_contact_date ?? "")
  );
  const lostVisible = lostExpanded ? lostSorted : lostSorted.slice(0, LOST_PAGE_SIZE);

  async function moveContact(id: string, patch: Record<string, unknown>) {
    const result = await updateContact(id, patch);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDrop(e: React.DragEvent, stage: ContactStage) {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain");
    const contact = allRows.find((r) => r.id === id);
    if (!contact || contact.etapa === stage) return;

    if (stage === "perdido") {
      setPendingLostId(id);
      return;
    }
    await moveContact(id, { etapa: stage });
  }

  async function handleLostConfirm(motivo: string) {
    const contact = pendingLostId ? allRows.find((r) => r.id === pendingLostId) : null;
    setPendingLostId(null);
    if (!contact) return;
    await moveContact(contact.id, {
      etapa: "perdido",
      notas_seguimiento: withLostReasonNote(contact.notas_seguimiento, motivo),
      last_contact_date: todayISO(),
    });
  }

  const pendingLostContact = pendingLostId ? (allRows.find((r) => r.id === pendingLostId) ?? null) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KANBAN_STAGES.map((stage) => {
          const stageRows = rowsByStage(stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex flex-col gap-3 rounded-2xl border p-3 transition-colors ${
                dragOverStage === stage
                  ? "border-mh-pink bg-mh-pink-light/30"
                  : "border-mh-border bg-mh-bg"
              }`}
            >
              <div
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${COLUMN_HEADER_CLASSES[stage]}`}
              >
                <span>{STAGE_LABELS[stage]}</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
                  {stageRows.length}
                </span>
              </div>
              <div className="min-h-[80px] space-y-2">
                {stageRows.map((contact) => (
                  <LeadCard key={contact.id} contact={contact} onOpenContact={onOpenContact} />
                ))}
                {stageRows.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-mh-ink-muted">
                    Sin leads en esta etapa.
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStage("perdido");
          }}
          onDragLeave={() => setDragOverStage((s) => (s === "perdido" ? null : s))}
          onDrop={(e) => handleDrop(e, "perdido")}
          className={`flex flex-col gap-3 rounded-2xl border p-3 transition-colors ${
            dragOverStage === "perdido"
              ? "border-mh-pink bg-mh-pink-light/30"
              : "border-mh-border bg-mh-bg"
          }`}
        >
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${COLUMN_HEADER_CLASSES.perdido}`}
          >
            <span>Perdido</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
              {lostRows.length}
            </span>
          </div>
          <div className="min-h-[80px] space-y-2">
            {lostVisible.map((contact) => (
              <LeadCard key={contact.id} contact={contact} onOpenContact={onOpenContact} />
            ))}
            {lostRows.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-mh-ink-muted">Sin perdidos.</p>
            )}
            {!lostExpanded && lostSorted.length > LOST_PAGE_SIZE && (
              <button
                onClick={() => setLostExpanded(true)}
                className="w-full rounded-lg py-2 text-xs font-semibold text-mh-pink hover:bg-mh-pink-light/40"
              >
                Mostrar más ({lostSorted.length - LOST_PAGE_SIZE} más)
              </button>
            )}
          </div>
        </div>
      </div>

      {pendingLostContact && (
        <LostReasonModal
          contactName={pendingLostContact.name}
          onClose={() => setPendingLostId(null)}
          onConfirm={handleLostConfirm}
        />
      )}
    </div>
  );
}
