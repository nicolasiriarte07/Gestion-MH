import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";

// Paleta categórica validada (ver skill de dataviz): orden fijo, nunca
// ciclada arbitrariamente por fila.
const CATEGORICAL_COLORS = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834",
];
const SEQUENTIAL_COLOR = "#2a78d6";

export type BreakdownRow = {
  label: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};

export function rowValue(row: BreakdownRow, metric: Metric, currency: Currency): number {
  if (metric === "ventas") return row.line_count;
  return currency === "usd" ? row.total_usd : row.total_ars;
}

export function formatValue(value: number, metric: Metric, currency: Currency): string {
  if (metric === "ventas") return String(Math.round(value));
  return formatCurrency(value, currency);
}

export function BreakdownCard({
  title,
  rows,
  colorMode,
  metric,
  currency,
  maxRows = 8,
}: {
  title: string;
  rows: BreakdownRow[];
  colorMode: "categorical" | "sequential";
  metric: Metric;
  currency: Currency;
  maxRows?: number;
}) {
  const sorted = [...rows].sort(
    (a, b) => rowValue(b, metric, currency) - rowValue(a, metric, currency)
  );
  const visible = sorted.slice(0, maxRows);
  const rest = sorted.slice(maxRows);
  const finalRows =
    rest.length > 0
      ? [
          ...visible,
          {
            label: `Otras (${rest.length})`,
            total_ars: rest.reduce((s, r) => s + r.total_ars, 0),
            total_usd: rest.reduce((s, r) => s + r.total_usd, 0),
            line_count: rest.reduce((s, r) => s + r.line_count, 0),
          },
        ]
      : visible;

  const values = finalRows.map((r) => rowValue(r, metric, currency));
  const total = values.reduce((s, v) => s + v, 0);
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">{title}</p>
      {finalRows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div className="space-y-2">
          {finalRows.map((row, i) => {
            const value = rowValue(row, metric, currency);
            const pct = total > 0 ? (value / total) * 100 : 0;
            const widthPct = (value / max) * 100;
            const color =
              colorMode === "categorical"
                ? CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]
                : SEQUENTIAL_COLOR;

            return (
              <div
                key={row.label}
                title={`${row.label}: ${formatValue(value, metric, currency)} · ${row.line_count} línea(s)`}
              >
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">
                    {row.label}
                  </span>
                  <span className="whitespace-nowrap text-slate-500">
                    {formatValue(value, metric, currency)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
