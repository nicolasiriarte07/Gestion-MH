import { formatCurrency } from "@/lib/currency";
import type { Metric, Currency } from "./MetricControls";

const CHART_HEIGHT = 140;
const TOP_PADDING = 10;
const POINT_SPACING = 56;
const MIN_WIDTH = 300;

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
  const width = Math.max(rows.length * POINT_SPACING, MIN_WIDTH);
  const svgHeight = CHART_HEIGHT + TOP_PADDING;

  const points = rows.map((row, i) => {
    const value = rowValue(row, metric, currency);
    const x =
      rows.length > 1
        ? (i / (rows.length - 1)) * (width - POINT_SPACING) + POINT_SPACING / 2
        : width / 2;
    const y = svgHeight - (value / max) * CHART_HEIGHT;
    return { x, y, value, row };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Evolución de ventas
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg width={width} height={svgHeight + 20} viewBox={`0 0 ${width} ${svgHeight + 20}`}>
            <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} />
            {points.map((p) => (
              <g key={p.row.bucket_start}>
                <circle cx={p.x} cy={p.y} r={3.5} fill="#2a78d6">
                  <title>{`${formatLabel(p.row.bucket_start, bucket)}: ${formatValue(p.value, metric, currency)}`}</title>
                </circle>
                <text
                  x={p.x}
                  y={svgHeight + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94a3b8"
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
