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

const CURRENT_YEAR_COLOR = "#f3437e";
const PREVIOUS_YEAR_COLOR = "#f7b8d1";

function formatScaled(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const rounded = Math.round(scaled * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}${suffix}`;
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `US$${formatScaled(value, 1_000_000, "M")}`;
  if (value >= 1_000) return `US$${formatScaled(value, 1_000, "K")}`;
  return formatCurrency(value, "usd");
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

export default function YearComparisonChart({
  currentYear,
  previousYear,
  currentYearMonthly,
  previousYearMonthly,
}: {
  currentYear: number;
  previousYear: number;
  currentYearMonthly: number[];
  previousYearMonthly: number[];
}) {
  const max = Math.max(...currentYearMonthly, ...previousYearMonthly, 1);
  const plotWidth = Math.max(MONTH_LABELS.length * POINT_SPACING, 300);
  const width = plotWidth + LEFT_PADDING;
  const svgHeight = CHART_HEIGHT + TOP_PADDING;

  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * i);

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
        Comparación de facturación mensual en USD entre {previousYear} y {currentYear}
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

          <path
            d={buildPath(previousYearMonthly, max, plotWidth, svgHeight)}
            fill="none"
            stroke={PREVIOUS_YEAR_COLOR}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={buildPath(currentYearMonthly, max, plotWidth, svgHeight)}
            fill="none"
            stroke={CURRENT_YEAR_COLOR}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {previousYearMonthly.map((value, i) => (
            <circle
              key={`prev-${i}`}
              cx={pointX(i)}
              cy={pointY(value)}
              r={3}
              fill={PREVIOUS_YEAR_COLOR}
            >
              <title>{`${MONTH_LABELS[i]} ${previousYear}: ${formatCurrency(value, "usd")}`}</title>
            </circle>
          ))}
          {currentYearMonthly.map((value, i) => (
            <circle
              key={`cur-${i}`}
              cx={pointX(i)}
              cy={pointY(value)}
              r={3}
              fill={CURRENT_YEAR_COLOR}
            >
              <title>{`${MONTH_LABELS[i]} ${currentYear}: ${formatCurrency(value, "usd")}`}</title>
            </circle>
          ))}

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
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: PREVIOUS_YEAR_COLOR }}
          />
          {previousYear}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: CURRENT_YEAR_COLOR }}
          />
          {currentYear}
        </span>
      </div>
    </div>
  );
}
