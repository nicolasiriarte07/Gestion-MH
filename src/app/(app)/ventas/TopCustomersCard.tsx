import type { Metric, Currency } from "./MetricControls";
import { rowValue, formatValue, type BreakdownRow } from "./BreakdownCard";

const SEQUENTIAL_COLOR = "#2a78d6";
const TOP_N = 10;

export function TopCustomersCard({
  rows,
  metric,
  currency,
}: {
  rows: BreakdownRow[];
  metric: Metric;
  currency: Currency;
}) {
  const top = [...rows]
    .sort((a, b) => rowValue(b, metric, currency) - rowValue(a, metric, currency))
    .slice(0, TOP_N);

  const max = Math.max(...top.map((r) => rowValue(r, metric, currency)), 1);

  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="mb-4 text-sm font-bold text-mh-ink">Top 10 clientes</p>
      {top.length === 0 ? (
        <p className="text-sm text-mh-ink-muted">Sin datos en este período.</p>
      ) : (
        <div className="space-y-3">
          {top.map((row, i) => {
            const value = rowValue(row, metric, currency);
            const widthPct = (value / max) * 100;

            return (
              <div
                key={row.label}
                title={`${row.label}: ${formatValue(value, metric, currency)} · ${row.line_count} línea(s)`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 truncate font-medium text-mh-ink">
                    <span className="w-4 shrink-0 text-right text-mh-ink-muted">
                      {i + 1}
                    </span>
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-mh-ink-muted">
                    {formatValue(value, metric, currency)}
                  </span>
                </div>
                <div className="ml-6 h-1.5 rounded-full bg-mh-pink-light">
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
