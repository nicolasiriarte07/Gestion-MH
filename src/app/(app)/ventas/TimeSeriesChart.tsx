import { formatCurrency } from "@/lib/currency";

const MAX_BAR_HEIGHT = 140;

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
}: {
  rows: { bucket_start: string; total_ars: number }[];
  bucket: "day" | "week" | "month";
}) {
  const max = Math.max(...rows.map((r) => r.total_ars), 1);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Evolución de ventas
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos en este período.</p>
      ) : (
        <div
          className="flex items-end gap-1 overflow-x-auto"
          style={{ height: MAX_BAR_HEIGHT + 24 }}
        >
          {rows.map((r) => {
            const height = Math.max((r.total_ars / max) * MAX_BAR_HEIGHT, 3);
            return (
              <div
                key={r.bucket_start}
                className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
                style={{ height: MAX_BAR_HEIGHT + 24 }}
                title={`${formatLabel(r.bucket_start, bucket)}: ${formatCurrency(r.total_ars)}`}
              >
                <div
                  className="w-full rounded-t bg-brand"
                  style={{ height }}
                />
                <span className="whitespace-nowrap text-[10px] text-slate-400">
                  {formatLabel(r.bucket_start, bucket)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
