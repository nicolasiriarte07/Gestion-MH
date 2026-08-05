import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";
import type { BreakdownRow } from "./BreakdownCard";

// Paleta categórica restringida a la marca (rosa/azul MH + verde/amarillo/
// rojo), orden fijo validado con la skill de dataviz
// (node scripts/validate_palette.js "azul,rosa,verde,amarillo,rojo"
// --mode light → todos los checks en verde). Nunca se cicla arbitrario.
const CATEGORICAL_COLORS = ["#2a78d6", "#f3437e", "#008300", "#eda100", "#e34948"];

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
  colorMap,
}: {
  title: string;
  rows: BreakdownRow[];
  metric: Metric;
  currency: Currency;
  colorMap?: Record<string, string>;
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
      color: colorMap?.[row.label] ?? CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
      label: row.label,
      value,
      pct: fraction * 100,
    };
  });

  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="mb-4 text-sm font-bold text-mh-ink">{title}</p>
      {slices.length === 0 ? (
        <p className="text-sm text-mh-ink-muted">Sin datos en este período.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
            {slices.map((s) => (
              <path key={s.label} d={s.path} fill={s.color}>
                <title>{`${s.label}: ${formatValue(s.value, metric, currency)} · ${s.pct.toFixed(0)}%`}</title>
              </path>
            ))}
          </svg>
          <div className="min-w-[140px] flex-1 space-y-2">
            {slices.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate font-medium text-mh-ink">
                    {s.label}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-mh-ink-muted">
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
