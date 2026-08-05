import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";

const CHART_HEIGHT = 140;
const TOP_PADDING = 10;
const LEFT_PADDING = 44;
const POINT_SPACING = 56;
const MIN_WIDTH = 300;
const GRID_STEPS = 4;

export type TimeSeriesRow = {
  bucket_start: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};

function rowValue(row: TimeSeriesRow, metric: Metric, currency: Currency): number {
  if (metric === "ventas") return row.line_count;
  return currency === "usd" ? row.total_usd : row.total_ars;
}

function formatValue(value: number, metric: Metric, currency: Currency): string {
  if (metric === "ventas") return String(Math.round(value));
  return formatCurrency(value, currency);
}

// 1 decimal (sin el ".0" si es exacto) en vez de redondear a entero: con
// enteros, dos escalones de grilla cercanos pueden redondear al mismo
// número o "saltarse" uno (ej. 2.65M -> "3M", dejando un salto de 1M a
// 3M sin pasar por "2M").
function formatScaled(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const rounded = Math.round(scaled * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}${suffix}`;
}

function formatAxisValue(value: number, metric: Metric, currency: Currency): string {
  if (metric === "ventas") return String(Math.round(value));
  const symbol = currency === "usd" ? "US$" : "$";
  if (value >= 1_000_000) return `${symbol}${formatScaled(value, 1_000_000, "M")}`;
  if (value >= 1_000) return `${symbol}${formatScaled(value, 1_000, "K")}`;
  return formatCurrency(value, currency);
}

function formatLabel(dateStr: string, bucket: "day" | "week" | "month"): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (bucket === "month") {
    return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export function TimeSeriesChart({
  rows,
  bucket,
  metric,
  currency,
}: {
  rows: TimeSeriesRow[];
  bucket: "day" | "week" | "month";
  metric: Metric;
  currency: Currency;
}) {
  const max = Math.max(...rows.map((r) => rowValue(r, metric, currency)), 1);
  const plotWidth = Math.max(rows.length * POINT_SPACING, MIN_WIDTH);
  const width = plotWidth + LEFT_PADDING;
  const svgHeight = CHART_HEIGHT + TOP_PADDING;

  const points = rows.map((row, i) => {
    const value = rowValue(row, metric, currency);
    const x =
      LEFT_PADDING +
      (rows.length > 1
        ? (i / (rows.length - 1)) * (plotWidth - POINT_SPACING) + POINT_SPACING / 2
        : plotWidth / 2);
    const y = svgHeight - (value / max) * CHART_HEIGHT;
    return { x, y, value, row };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${svgHeight} L ${points[0].x.toFixed(1)} ${svgHeight} Z`
      : "";

  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * i);

  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="mb-4 text-sm font-bold text-mh-ink">Evolución de ventas</p>
      {rows.length === 0 ? (
        <p className="text-sm text-mh-ink-muted">Sin datos en este período.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg width={width} height={svgHeight + 20} viewBox={`0 0 ${width} ${svgHeight + 20}`}>
            {gridValues.map((g) => {
              const y = svgHeight - (g / max) * CHART_HEIGHT;
              return (
                <g key={g}>
                  <line
                    x1={LEFT_PADDING}
                    x2={width}
                    y1={y}
                    y2={y}
                    stroke="#eef0f4"
                    strokeDasharray="4 4"
                  />
                  <text x={LEFT_PADDING - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#9aa1ae">
                    {formatAxisValue(g, metric, currency)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill="#f3437e" fillOpacity={0.08} stroke="none" />
            <path d={linePath} fill="none" stroke="#f3437e" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

            {points.map((p) => (
              <g key={p.row.bucket_start}>
                <circle cx={p.x} cy={p.y} r={3} fill="#f3437e">
                  <title>{`${formatLabel(p.row.bucket_start, bucket)}: ${formatValue(p.value, metric, currency)}`}</title>
                </circle>
                <text
                  x={p.x}
                  y={svgHeight + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#9aa1ae"
                >
                  {formatLabel(p.row.bucket_start, bucket)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
