import { formatCurrency } from "@/lib/currency";

const CHART_HEIGHT = 160;
const TOP_PADDING = 10;
const LEFT_PADDING = 52;
const POINT_SPACING = 56;
const GRID_STEPS = 4;

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export type YearSeries = { year: number; monthly: number[] };

// Rampa secuencial de un solo hue (rosa MH), de más clara (año más
// viejo) a más oscura/saturada (año más reciente) — recencia = más
// énfasis visual. Si hay menos de 3 series se usan los últimos N tonos,
// así 2 series quedan igual que antes (claro + rosa de marca).
const COLOR_RAMP = ["#fcd3e4", "#f7b8d1", "#f3437e"];

function colorsFor(count: number): string[] {
  return COLOR_RAMP.slice(Math.max(0, COLOR_RAMP.length - count));
}

function formatScaled(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const rounded = Math.round(scaled * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}${suffix}`;
}

// El título ya dice "en USD", así que no hace falta repetir "US$" en
// cada marca del eje — "$100k" en vez de "US$100K" (más limpio, igual
// que el resto de los charts del módulo).
function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `$${formatScaled(value, 1_000_000, "M")}`;
  if (value >= 1_000) return `$${formatScaled(value, 1_000, "k")}`;
  return `$${Math.round(value)}`;
}

function buildPath(
  values: number[],
  max: number,
  plotWidth: number,
  svgHeight: number
): string {
  return values
    .map((value, i) => {
      const x =
        LEFT_PADDING +
        (values.length > 1
          ? (i / (values.length - 1)) * (plotWidth - POINT_SPACING) + POINT_SPACING / 2
          : plotWidth / 2);
      const y = svgHeight - (max > 0 ? (value / max) * CHART_HEIGHT : 0);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function YearComparisonChart({ series }: { series: YearSeries[] }) {
  const colors = colorsFor(series.length);
  const allValues = series.flatMap((s) => s.monthly);
  const max = Math.max(...allValues, 1);
  const plotWidth = Math.max(MONTH_LABELS.length * POINT_SPACING, 300);
  const width = plotWidth + LEFT_PADDING;
  const svgHeight = CHART_HEIGHT + TOP_PADDING;

  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * i);
  const years = series.map((s) => s.year);
  const yearsLabel =
    years.length > 1
      ? `${years.slice(0, -1).join(", ")} y ${years[years.length - 1]}`
      : String(years[0] ?? "");

  function pointX(i: number): number {
    return (
      LEFT_PADDING +
      (i / (MONTH_LABELS.length - 1)) * (plotWidth - POINT_SPACING) +
      POINT_SPACING / 2
    );
  }

  function pointY(value: number): number {
    return svgHeight - (max > 0 ? (value / max) * CHART_HEIGHT : 0);
  }

  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-bold text-mh-ink">Comparación Interanual</p>
      <p className="mb-4 text-xs font-medium text-mh-ink-muted">
        Comparación de facturación mensual en USD entre {yearsLabel}
      </p>

      <div className="overflow-x-auto">
        <svg width={width} height={svgHeight + 20} viewBox={`0 0 ${width} ${svgHeight + 20}`}>
          {gridValues.map((g) => {
            const y = svgHeight - (max > 0 ? (g / max) * CHART_HEIGHT : 0);
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
                  {formatAxisValue(g)}
                </text>
              </g>
            );
          })}

          {/* Líneas: la más vieja primero (atrás), la más reciente al
              final (arriba y más oscura), para que quede más visible. */}
          {series.map((s, idx) => (
            <path
              key={`line-${s.year}`}
              d={buildPath(s.monthly, max, plotWidth, svgHeight)}
              fill="none"
              stroke={colors[idx]}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {series.map((s, idx) =>
            s.monthly.map((value, i) => (
              <circle
                key={`pt-${s.year}-${i}`}
                cx={pointX(i)}
                cy={pointY(value)}
                r={3}
                fill={colors[idx]}
              >
                <title>{`${MONTH_LABELS[i]} ${s.year}: ${formatCurrency(value, "usd")}`}</title>
              </circle>
            ))
          )}

          {MONTH_LABELS.map((label, i) => (
            <text
              key={label}
              x={pointX(i)}
              y={svgHeight + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#9aa1ae"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs font-semibold text-mh-ink-muted">
        {series.map((s, idx) => (
          <span key={s.year} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
            {s.year}
          </span>
        ))}
      </div>
    </div>
  );
}
