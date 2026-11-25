"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import Card from "@/components/ds/Card";
import type { ContactRow } from "./contactRow";
import { STAGE_LABELS, STAGE_TONE_CLASSES, formatDateDMY } from "./contactStages";
import { isOverdue, needsFollowUpThisWeek, todayISO } from "./followUp";

// Vencidos o dentro de los próximos 7 días, sin importar la etapa
// (salvo "perdido": a un lead perdido no tiene sentido recordarle
// seguimiento). Se ordenan por fecha, los vencidos primero.
export default function FollowUpBanner({
  rows,
  onSelect,
}: {
  rows: ContactRow[];
  onSelect: (id: string) => void;
}) {
  const today = todayISO();

  const dueRows = useMemo(
    () =>
      rows
        .filter((c) => c.etapa !== "perdido" && needsFollowUpThisWeek(c, today))
        .sort((a, b) => (a.proximo_seguimiento ?? "").localeCompare(b.proximo_seguimiento ?? "")),
    [rows, today]
  );

  if (dueRows.length === 0) return null;

  return (
    <Card padding="sm" className="font-inter">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-mh-ink">
        <Clock size={16} className="text-mh-pink" />
        Para contactar esta semana
        <span className="rounded-full bg-mh-pink-light px-2 py-0.5 text-xs font-extrabold text-mh-pink">
          {dueRows.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dueRows.map((contact) => {
          const overdue = isOverdue(contact, today);
          return (
            <button
              key={contact.id}
              onClick={() => onSelect(contact.id)}
              className="flex shrink-0 flex-col items-start gap-1 rounded-xl border border-mh-border bg-white px-3 py-2 text-left hover:border-mh-pink/40"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-mh-ink">{contact.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STAGE_TONE_CLASSES[contact.etapa]}`}
                >
                  {STAGE_LABELS[contact.etapa]}
                </span>
              </div>
              <span className={`text-xs font-semibold ${overdue ? "text-red-600" : "text-mh-ink-muted"}`}>
                {overdue ? "Vencido " : "Para el "}
                {formatDateDMY(contact.proximo_seguimiento)}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
