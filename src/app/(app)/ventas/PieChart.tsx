import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";
import type { BreakdownRow } from "./BreakdownCard";

// Misma paleta categórica que BreakdownCard (ver skill de dataviz): orden
// fijo, nunca ciclada arbitrariamente por fila.
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

const SIZE = 160;
const RADIUS = 70;
const CENTER = SIZE / 2;

function rowValue(row: BreakdownRow, metric: Metric, currency: Currency): number {
  if (metric === "ventas") return row.line_count;
  return currency === "usd" ? row.total_usd : row.total_ars;
}

function formatValue(value: number, metric: Metric, currency: Currency): string {
  if (metric === "ventas") return String(Math.round(value));
  return formatCurrency(value, currency);
}

function arcPoint(angle: number): { x: number; y: number } {
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

export function PieChart({
  title,
  rows,
  metric,
  currency,
}: {
  title: string;
  rows: BreakdownRow[];
  metric: Metric;
  currency: Currency;
}) {
  const sorted = [...rows]
    .filter((r) => rowValue(r, metric, currency) > 0)
    .sort((a, b) => rowValue(b, metric, currency) - rowValue(a, metric, currency));

  const total = sorted.reduce((s, r) => s + rowValue(r, metric, currency), 0);

  const startAngles: number[] = [];
  sorted.reduce((cursor, row) => {
    const value = rowValue(row, metric, currency);
    const fraction = total > 0 ? value / total : 0;
    startAngles.push(cursor);
    return cursor + fraction * 2 * Math.PI;
  }, -Math.PI / 2);

  const slices = sorted.map((row, i) => {
    const value = rowValue(row, metric, currency);
    const fraction = total > 0 ? value / total : 0;
    const startAngle = startAngles[i];
    const endAngle = startAngle + fraction * 2 * Math.PI;

    const start = arcPoint(startAngle);
    const end = arcPoint(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path =
      fraction >= 0.9999
        ? `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS} Z`
        : `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;

    return {
      path,
      color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
      label: row.label,
      value,
      pct: fraction * 100,
    };
  });

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">{title}</p>
      {slices.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {slices.map((s) => (
              <path key={s.label} d={s.path} fill={s.color}>
                <title>{`${s.label}: ${formatValue(s.value, metric, currency)} · ${s.pct.toFixed(0)}%`}</title>
              </path>
            ))}
          </svg>
          <div className="min-w-[140px] flex-1 space-y-1.5">
            {slices.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate font-medium text-slate-700">
                    {s.label}
                  </span>
                </span>
                <span className="whitespace-nowrap text-slate-500">
                  {formatValue(s.value, metric, currency)} · {s.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
