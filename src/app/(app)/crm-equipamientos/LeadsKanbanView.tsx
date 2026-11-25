"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ContactStage } from "@/lib/types";
import type { ContactRow } from "./contactRow";
import { STAGE_LABELS } from "./contactStages";
import { updateContact } from "./actions";
import LeadCard from "./LeadCard";

const KANBAN_STAGES: ContactStage[] = ["lead", "contactado", "cotizado"];

const COLUMN_HEADER_CLASSES: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700",
  contactado: "bg-mh-blue-light text-mh-blue",
  cotizado: "bg-amber-100 text-amber-700",
};

// Drag & drop nativo (sin librería): cada LeadCard es "draggable" y
// pone su id en dataTransfer; cada columna acepta el drop y actualiza
// la etapa. "Cliente" y "Perdido" no son columnas del tablero — se
// manejan con los botones de la tarjeta (ver LeadCard).
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
  const [showLost, setShowLost] = useState(false);

  function rowsByStage(stage: ContactStage): ContactRow[] {
    return rows
      .filter((r) => r.etapa === stage)
      .sort((a, b) =>
        (a.proximo_seguimiento ?? "9999-99-99").localeCompare(
          b.proximo_seguimiento ?? "9999-99-99"
        )
      );
  }

  async function handleDrop(e: React.DragEvent, stage: ContactStage) {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain");
    const contact = rows.find((r) => r.id === id);
    if (!contact || contact.etapa === stage) return;
    const result = await updateContact(id, { etapa: stage });
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </div>

      {lostRows.length > 0 && (
        <div className="rounded-2xl border border-mh-border bg-mh-surface">
          <button
            onClick={() => setShowLost((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
          >
            {showLost ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Perdidos ({lostRows.length})
          </button>
          {showLost && (
            <div className="grid grid-cols-1 gap-2 border-t border-mh-border p-3 sm:grid-cols-2 lg:grid-cols-3">
              {lostRows.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onOpenContact(contact.id)}
                  className="rounded-xl border border-mh-border bg-white p-3 text-left hover:border-mh-pink/40"
                >
                  <p className="truncate text-sm font-semibold text-mh-ink">{contact.name}</p>
                  <p className="truncate text-xs text-mh-ink-muted">{contact.city ?? "—"}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
