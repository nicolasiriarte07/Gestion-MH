export type RecencyByVisitRow = {
  visit_number: number;
  avg_days: number;
  customers_count: number;
};

const TRANSITION_LABELS: Record<number, string> = {
  2: "1ª → 2ª compra",
  3: "2ª → 3ª compra",
  4: "3ª → 4ª compra",
  5: "4ª → 5ª compra",
  6: "5ª → 6ª compra",
};

export default function RecencyByVisitCard({
  rows,
}: {
  rows: RecencyByVisitRow[];
}) {
  const byVisitNumber = new Map(rows.map((r) => [r.visit_number, r]));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Días entre compra y compra
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[2, 3, 4, 5, 6].map((visitNumber) => {
          const row = byVisitNumber.get(visitNumber);
          return (
            <div key={visitNumber} className="rounded-xl bg-slate-50 p-3">
              <p className="text-lg font-semibold text-slate-900">
                {row ? `${row.avg_days.toFixed(0)} día(s)` : "—"}
              </p>
              <p className="text-xs font-medium text-slate-600">
                {TRANSITION_LABELS[visitNumber]}
              </p>
              {row && (
                <p className="text-xs text-slate-400">
                  {row.customers_count} cliente(s)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
