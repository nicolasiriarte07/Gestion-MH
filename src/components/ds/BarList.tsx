export type BarListRow = {
  label: string;
  value: number;
};

export default function BarList({
  rows,
  formatValue,
}: {
  rows: BarListRow[];
  formatValue: (v: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-mh-ink-muted">Sin datos todavía.</p>
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <p className="w-28 shrink-0 truncate text-sm font-medium text-mh-ink">
            {row.label}
          </p>
          <div className="h-2 min-w-0 flex-1 rounded-full bg-mh-pink-light">
            <div
              className="h-2 rounded-full bg-mh-pink"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-sm font-semibold text-mh-ink">
            {formatValue(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
