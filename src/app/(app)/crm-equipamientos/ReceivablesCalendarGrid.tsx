"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { CrmInstallment } from "@/lib/types";

export type CalendarInstallment = CrmInstallment & {
  client_name: string;
  product: string;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS_PER_DAY = 3;

const CHIP_CLASSES = {
  green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  red: "bg-red-100 text-red-700 hover:bg-red-200",
  blue: "bg-mh-blue-light text-mh-blue hover:bg-mh-blue/20",
} as const;

function dateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
  );
}

function chipTone(inst: CalendarInstallment, today: string): keyof typeof CHIP_CLASSES {
  if (inst.paid) return "green";
  if (inst.due_date < today) return "red";
  return "blue";
}

// Mismo esqueleto que MarketingCalendarGrid.tsx (grilla mes + chips por
// día) aplicado a vencimientos de cuotas en vez de posteos/campañas: acá
// el color del chip es el estado de cobro (verde cobrada, rojo vencida,
// azul pendiente a futuro), no orgánico/pauta.
export default function ReceivablesCalendarGrid({
  installments,
  onSelectInstallment,
}: {
  installments: CalendarInstallment[];
  onSelectInstallment: (installment: CalendarInstallment) => void;
}) {
  const today = dateISO(new Date());
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const installmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarInstallment[]>();
    for (const inst of installments) {
      const list = map.get(inst.due_date) ?? [];
      list.push(inst);
      map.set(inst.due_date, list);
    }
    return map;
  }, [installments]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card padding="sm" className="font-inter">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-bold text-mh-ink capitalize">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCursor((c) =>
                c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
              )
            }
            className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
          >
            Hoy
          </button>
          <button
            onClick={() =>
              setCursor((c) =>
                c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
              )
            }
            className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-mh-border bg-mh-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-mh-bg px-2 py-2 text-center text-xs font-semibold text-mh-ink-muted uppercase"
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const iso = dateISO(day);
          const inMonth = day.getMonth() === cursor.month;
          const dayInstallments = installmentsByDay.get(iso) ?? [];
          const visible = dayInstallments.slice(0, MAX_CHIPS_PER_DAY);
          const rest = dayInstallments.length - visible.length;

          return (
            <div
              key={iso}
              className={`min-h-[110px] space-y-1 bg-mh-surface p-1.5 ${inMonth ? "" : "bg-mh-bg/60"}`}
            >
              <p
                className={`px-1 text-xs font-semibold ${
                  iso === today
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-mh-pink text-white"
                    : inMonth
                      ? "text-mh-ink"
                      : "text-mh-ink-muted/60"
                }`}
              >
                {day.getDate()}
              </p>
              <div className="space-y-1">
                {visible.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => onSelectInstallment(inst)}
                    title={`${inst.client_name} · ${inst.product} · ${formatCurrency(inst.amount)}`}
                    className={`flex w-full flex-col truncate rounded-lg px-2 py-1 text-left text-xs font-semibold ${CHIP_CLASSES[chipTone(inst, today)]}`}
                  >
                    <span className="truncate">{inst.client_name}</span>
                    <span className="truncate font-normal">{formatCurrency(inst.amount)}</span>
                  </button>
                ))}
                {rest > 0 && (
                  <p className="px-1 text-[11px] font-semibold text-mh-ink-muted">+{rest} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
