import type { Metric, Currency } from "./MetricControls";
import { rowValue, formatValue, type BreakdownRow } from "./BreakdownCard";

// Versión con el sistema de diseño nuevo del mismo componente que
// BreakdownCard.tsx (misma lógica/datos: reusa sus helpers puros). No se
// tocó BreakdownCard.tsx porque Proveedores lo sigue usando con el
// estilo anterior; este archivo es solo para Ventas.
const SEQUENTIAL_COLOR = "#2a78d6";

export function VentasBreakdownCard({
  title,
  rows,
  metric,
  currency,
  maxRows = 8,
}: {
  title: string;
  rows: BreakdownRow[];
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
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="mb-4 text-sm font-bold text-mh-ink">{title}</p>
      {finalRows.length === 0 ? (
        <p className="text-sm text-mh-ink-muted">Sin datos en este período.</p>
      ) : (
        <div className="space-y-3">
          {finalRows.map((row) => {
            const value = rowValue(row, metric, currency);
            const pct = total > 0 ? (value / total) * 100 : 0;
            const widthPct = (value / max) * 100;

            return (
              <div
                key={row.label}
                title={`${row.label}: ${formatValue(value, metric, currency)} · ${row.line_count} línea(s)`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-mh-ink">
                    {row.label}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-mh-ink-muted">
                    {formatValue(value, metric, currency)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-mh-pink-light">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: SEQUENTIAL_COLOR }}
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
