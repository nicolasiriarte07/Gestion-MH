import { formatCurrency } from "@/lib/currency";

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

export type RevenueTopCustomerRow = {
  rank: number;
  customer_name: string;
  total_ars: number;
  pct_of_total: number;
};

export default function RevenueParetoChart({
  rows,
  topCustomers,
}: {
  rows: RevenueParetoRow[];
  topCustomers: RevenueTopCustomerRow[];
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

  // % acumulado propio de esta lista (independiente del `pct_of_total` de
  // cada fila), para que el último renglón coincida con el % del decil 10
  // del gráfico y se vea de dónde sale ese número.
  const topCustomersWithCumulative = topCustomers.reduce<
    Array<RevenueTopCustomerRow & { cumulative_pct: number }>
  >((acc, c) => {
    const previousCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative_pct : 0;
    acc.push({ ...c, cumulative_pct: previousCumulative + c.pct_of_total });
    return acc;
  }, []);

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

      <div className="flex flex-col gap-4 lg:flex-row">
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

        {topCustomersWithCumulative.length > 0 && (
          <div className="min-w-0 flex-1 lg:border-l lg:border-slate-100 lg:pl-4">
            <p className="mb-2 text-xs font-medium text-slate-500">
              {`Los ${topCustomersWithCumulative.length} clientes que forman ese TOP 10%`}
            </p>
            <div className="max-h-[220px] overflow-y-auto overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-xs text-slate-400">
                    <th className="w-6 pb-1 font-normal">#</th>
                    <th className="pb-1 font-normal">Cliente</th>
                    <th className="w-28 pb-1 text-right font-normal">
                      Facturación
                    </th>
                    <th className="w-12 pb-1 text-right font-normal">%</th>
                    <th className="w-14 pb-1 text-right font-normal">
                      % acum.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomersWithCumulative.map((c) => (
                    <tr key={c.rank} className="border-t border-slate-100">
                      <td className="py-1 text-slate-400">{c.rank}</td>
                      <td className="max-w-0 truncate py-1 pr-2 text-slate-700">
                        {c.customer_name}
                      </td>
                      <td className="whitespace-nowrap py-1 text-right text-slate-700">
                        {formatCurrency(c.total_ars)}
                      </td>
                      <td className="whitespace-nowrap py-1 text-right text-slate-500">
                        {c.pct_of_total.toFixed(1)}%
                      </td>
                      <td className="whitespace-nowrap py-1 text-right font-medium text-brand-dark">
                        {c.cumulative_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
