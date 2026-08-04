const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 44;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 12;
const PADDING_RIGHT = 10;
const GRID_STEPS = 4;

export type AreaChartRow = {
  date: string;
  value: number;
};

// Formato compacto para el eje Y ($8M, $250K, ...) — el eje solo necesita
// ubicar el orden de magnitud, no el monto exacto (eso está en el tooltip
// y en las mini-métricas debajo del gráfico).
function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function AreaLineChart({ rows }: { rows: AreaChartRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-mh-ink-muted">
        Sin datos todavía.
      </div>
    );
  }

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const max = Math.max(...rows.map((r) => r.value), 1);

  function xFor(i: number): number {
    return rows.length > 1
      ? PADDING_LEFT + (i / (rows.length - 1)) * plotWidth
      : PADDING_LEFT + plotWidth / 2;
  }
  function yFor(value: number): number {
    return PADDING_TOP + plotHeight - (value / max) * plotHeight;
  }

  const linePath = rows
    .map((r, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(r.value).toFixed(1)}`)
    .join(" ");

  // Relleno plano (sin degradado, por pedido explícito) con opacidad baja:
  // se ve suave sin usar un <linearGradient>.
  const areaPath =
    `${linePath} L ${xFor(rows.length - 1).toFixed(1)} ${(PADDING_TOP + plotHeight).toFixed(1)}` +
    ` L ${xFor(0).toFixed(1)} ${(PADDING_TOP + plotHeight).toFixed(1)} Z`;

  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * i);

  // Etiquetas del eje X: como mucho ~7, para que no se amontonen con
  // muchos puntos (ej. 30 días).
  const labelStride = Math.max(1, Math.ceil(rows.length / 7));

  return (
    <div className="overflow-x-auto">
      <svg
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="min-w-[480px]"
      >
        {gridValues.map((g) => (
          <g key={g}>
            <line
              x1={PADDING_LEFT}
              x2={CHART_WIDTH - PADDING_RIGHT}
              y1={yFor(g)}
              y2={yFor(g)}
              stroke="#eef0f4"
              strokeDasharray="4 4"
            />
            <text x={PADDING_LEFT - 8} y={yFor(g) + 3} textAnchor="end" fontSize={10} fill="#9aa1ae">
              {formatAxisValue(g)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="#f3437e" fillOpacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke="#f3437e" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {rows.map((r, i) => (
          <circle key={r.date} cx={xFor(i)} cy={yFor(r.value)} r={3} fill="#f3437e">
            <title>{`${formatDayLabel(r.date)}: ${formatAxisValue(r.value)}`}</title>
          </circle>
        ))}

        {rows.map((r, i) => {
          if (i % labelStride !== 0 && i !== rows.length - 1) return null;
          // Las etiquetas de las puntas usan text-anchor "start"/"end" en
          // vez de "middle": si no, el texto crece hacia el lado que se
          // sale del viewBox y el SVG lo recorta (ej. "04-ago" -> "04-ag").
          const anchor = i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle";
          return (
            <text
              key={`label-${r.date}`}
              x={xFor(i)}
              y={CHART_HEIGHT - 6}
              textAnchor={anchor}
              fontSize={10}
              fill="#9aa1ae"
            >
              {formatDayLabel(r.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
