import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";

const MAX_BAR_HEIGHT = 120;

// La columna "Dia" del archivo trae el nombre completo en minúscula (ej.
// "viernes"); acá lo mostramos abreviado en el eje del gráfico.
const SHORT_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  sábado: "Sáb",
  domingo: "Dom",
};

function shortLabel(label: string): string {
  return SHORT_LABELS[label] ?? (label.charAt(0).toUpperCase() + label.slice(1));
}

export type WeekdayRow = {
  weekday_label: string;
  sort_order: number;
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
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const max = Math.max(...sorted.map((r) => rowValue(r, metric, currency)), 1);
  const hasData = sorted.some((r) => rowValue(r, metric, currency) > 0);

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
          {sorted.map((row) => {
            const value = rowValue(row, metric, currency);
            const height = Math.max((value / max) * MAX_BAR_HEIGHT, 2);
            return (
              <div
                key={row.weekday_label}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                style={{ height: MAX_BAR_HEIGHT + 24 }}
                title={`${shortLabel(row.weekday_label)}: ${formatValue(value, metric, currency)}`}
              >
                <div className="w-full rounded-t bg-brand" style={{ height }} />
                <span className="whitespace-nowrap text-[10px] text-slate-400">
                  {shortLabel(row.weekday_label)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
