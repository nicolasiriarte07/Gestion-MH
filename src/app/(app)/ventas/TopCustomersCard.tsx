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
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">Top 10 clientes</p>
      {top.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div className="space-y-2">
          {top.map((row, i) => {
            const value = rowValue(row, metric, currency);
            const widthPct = (value / max) * 100;

            return (
              <div
                key={row.label}
                title={`${row.label}: ${formatValue(value, metric, currency)} · ${row.line_count} línea(s)`}
              >
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2 truncate font-medium text-slate-700">
                    <span className="w-4 shrink-0 text-right text-slate-400">
                      {i + 1}
                    </span>
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="whitespace-nowrap text-slate-500">
                    {formatValue(value, metric, currency)}
                  </span>
                </div>
                <div className="ml-6 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
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
