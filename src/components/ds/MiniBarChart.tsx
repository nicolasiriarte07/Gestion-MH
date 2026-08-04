export type BarRow = {
  label: string;
  value: number;
};

const CHART_HEIGHT = 140;

export default function MiniBarChart({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (rows.every((r) => r.value === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-mh-ink-muted">
        Sin datos todavía.
      </div>
    );
  }

  return (
    <div
      className="flex items-end gap-2.5"
      style={{ height: CHART_HEIGHT + 24 }}
    >
      {rows.map((r) => {
        const barHeight = Math.max(4, (r.value / max) * CHART_HEIGHT);
        return (
          <div key={r.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-md bg-mh-pink"
                style={{ height: barHeight }}
                title={r.label}
              />
            </div>
            <span className="text-[11px] font-medium text-mh-ink-muted">
              {r.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
