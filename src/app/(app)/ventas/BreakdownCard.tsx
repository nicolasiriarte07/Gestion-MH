import { formatCurrency } from "@/lib/currency";

// Paleta categórica validada (ver skill de dataviz): orden fijo, nunca
// ciclada arbitrariamente por fila.
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
const SEQUENTIAL_COLOR = "#2a78d6";

export type BreakdownRow = {
  label: string;
  total_ars: number;
  line_count: number;
};

export function BreakdownCard({
  title,
  rows,
  colorMode,
  maxRows = 8,
}: {
  title: string;
  rows: BreakdownRow[];
  colorMode: "categorical" | "sequential";
  maxRows?: number;
}) {
  const sorted = [...rows].sort((a, b) => b.total_ars - a.total_ars);
  const visible = sorted.slice(0, maxRows);
  const rest = sorted.slice(maxRows);
  const restTotal = rest.reduce((s, r) => s + r.total_ars, 0);
  const finalRows =
    rest.length > 0
      ? [
          ...visible,
          {
            label: `Otras (${rest.length})`,
            total_ars: restTotal,
            line_count: rest.reduce((s, r) => s + r.line_count, 0),
          },
        ]
      : visible;

  const total = finalRows.reduce((s, r) => s + r.total_ars, 0);
  const max = Math.max(...finalRows.map((r) => r.total_ars), 1);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">{title}</p>
      {finalRows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div className="space-y-2">
          {finalRows.map((row, i) => {
            const pct = total > 0 ? (row.total_ars / total) * 100 : 0;
            const widthPct = (row.total_ars / max) * 100;
            const color =
              colorMode === "categorical"
                ? CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]
                : SEQUENTIAL_COLOR;

            return (
              <div
                key={row.label}
                title={`${row.label}: ${formatCurrency(row.total_ars)} · ${row.line_count} línea(s)`}
              >
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">
                    {row.label}
                  </span>
                  <span className="whitespace-nowrap text-slate-500">
                    {formatCurrency(row.total_ars)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: color }}
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
