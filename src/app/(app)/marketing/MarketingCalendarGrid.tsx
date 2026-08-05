"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/ds/Card";
import { itemStartDate, itemEndDate, todayISO, type MarketingItem } from "./normalize";
import MarketingChip from "./MarketingChip";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS_PER_DAY = 3;

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

export default function MarketingCalendarGrid({
  items,
  onSelectItem,
}: {
  items: MarketingItem[];
  onSelectItem: (item: MarketingItem) => void;
}) {
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, MarketingItem[]>();
    for (const item of items) {
      const start = itemStartDate(item);
      const end = itemEndDate(item);
      for (const day of days) {
        const iso = dateISO(day);
        if (iso < start || iso > end) continue;
        const list = map.get(iso) ?? [];
        list.push(item);
        map.set(iso, list);
      }
    }
    return map;
  }, [items, days]);

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
              setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
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
              setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
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
          const dayItems = itemsByDay.get(iso) ?? [];
          const visible = dayItems.slice(0, MAX_CHIPS_PER_DAY);
          const rest = dayItems.length - visible.length;

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
                {visible.map((item) => (
                  <MarketingChip
                    key={`${item.kind}-${item.data.id}`}
                    item={item}
                    onClick={() => onSelectItem(item)}
                    dense
                  />
                ))}
                {rest > 0 && (
                  <p className="px-1 text-[11px] font-semibold text-mh-ink-muted">
                    +{rest} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
