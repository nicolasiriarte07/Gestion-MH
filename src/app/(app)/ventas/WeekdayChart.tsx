import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";

const MAX_BAR_HEIGHT = 120;

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

export type WeekdayRow = {
  weekday: number;
  total_ars: number;
  total_usd: number;
  line_count: number;
};

function rowValue(row: WeekdayRow, metric: Metric, currency: Currency): number {
  if (metric === "ventas") return row.line_count;
  return currency === "usd" ? row.total_usd : row.total_ars;
}

function formatValue(value: number, metric: Metric, currency: Currency): string {
  if (metric === "ventas") return String(Math.round(value));
  return formatCurrency(value, currency);
}

export function WeekdayChart({
  rows,
  metric,
  currency,
}: {
  rows: WeekdayRow[];
  metric: Metric;
  currency: Currency;
}) {
  const byWeekday = new Map(rows.map((r) => [r.weekday, r]));
  const allDays: WeekdayRow[] = Array.from({ length: 7 }, (_, i) => {
    const weekday = i + 1;
    return (
      byWeekday.get(weekday) ?? {
        weekday,
        total_ars: 0,
        total_usd: 0,
        line_count: 0,
      }
    );
  });

  const max = Math.max(...allDays.map((r) => rowValue(r, metric, currency)), 1);
  const hasData = allDays.some((r) => rowValue(r, metric, currency) > 0);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Ventas por día de la semana
      </p>
      {!hasData ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div
          className="flex items-end gap-2"
          style={{ height: MAX_BAR_HEIGHT + 24 }}
        >
          {allDays.map((row) => {
            const value = rowValue(row, metric, currency);
            const height = Math.max((value / max) * MAX_BAR_HEIGHT, 2);
            return (
              <div
                key={row.weekday}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                style={{ height: MAX_BAR_HEIGHT + 24 }}
                title={`${WEEKDAY_LABELS[row.weekday]}: ${formatValue(value, metric, currency)}`}
              >
                <div
                  className="w-full rounded-t bg-brand"
                  style={{ height }}
                />
                <span className="whitespace-nowrap text-[10px] text-slate-400">
                  {WEEKDAY_LABELS[row.weekday]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
