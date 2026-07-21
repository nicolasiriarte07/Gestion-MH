const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 36;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 10;
const PADDING_RIGHT = 10;
const GRID_LINES = [0, 25, 50, 75, 100];

export type RevenueParetoRow = {
  decile: number;
  cumulative_pct: number;
  customers_count: number;
};

export default function RevenueParetoChart({
  rows,
}: {
  rows: RevenueParetoRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm font-medium text-slate-700">
          Concentración de facturación
        </p>
        <p className="text-sm text-slate-400">Sin datos todavía.</p>
      </div>
    );
  }

  // El punto (0,0) inicial no viene de la base, se agrega para que la
  // curva arranque desde el origen (0% de clientes, 0% de facturación).
  const points = [{ decile: 0, cumulative_pct: 0 }, ...rows];

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function xFor(decile: number): number {
    return PADDING_LEFT + (decile / 100) * plotWidth;
  }
  function yFor(pct: number): number {
    return PADDING_TOP + plotHeight - (pct / 100) * plotHeight;
  }

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(p.decile).toFixed(1)} ${yFor(p.cumulative_pct).toFixed(1)}`
    )
    .join(" ");

  const top10 = rows.find((r) => r.decile === 10);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-slate-700">
        Concentración de facturación
      </p>
      <p className="mb-3 text-xs text-slate-500">
        ¿Cuánto de tu facturación viene de pocos clientes?
      </p>

      {top10 && (
        <p className="mb-3 rounded-lg bg-brand-light px-3 py-2 text-sm font-medium text-brand-dark">
          El TOP 10% de tus clientes genera el{" "}
          {top10.cumulative_pct.toFixed(0)}% de tu facturación.
        </p>
      )}

      <div className="overflow-x-auto">
        <svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="min-w-[480px]"
        >
          {GRID_LINES.map((g) => (
            <g key={g}>
              <line
                x1={PADDING_LEFT}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y1={yFor(g)}
                y2={yFor(g)}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING_LEFT - 6}
                y={yFor(g) + 3}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
              >
                {g}
              </text>
            </g>
          ))}

          <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} />

          {points.map((p) => (
            <circle
              key={p.decile}
              cx={xFor(p.decile)}
              cy={yFor(p.cumulative_pct)}
              r={4}
              fill="#2a78d6"
            >
              <title>{`${p.decile}% de los clientes → ${p.cumulative_pct.toFixed(1)}% de la facturación`}</title>
            </circle>
          ))}

          {points.map((p) => (
            <text
              key={`label-${p.decile}`}
              x={xFor(p.decile)}
              y={CHART_HEIGHT - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {p.decile}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
