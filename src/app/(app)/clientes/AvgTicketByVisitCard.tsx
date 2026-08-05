import { formatCurrency } from "@/lib/currency";
import Card from "@/components/ds/Card";

export type AvgTicketByVisitRow = {
  visit_number: number;
  avg_ticket_usd: number;
  customers_count: number;
};

const VISIT_LABELS: Record<number, string> = {
  1: "1ª compra",
  2: "2ª compra",
  3: "3ª compra",
  4: "4ª compra",
  5: "5ª compra",
};

export default function AvgTicketByVisitCard({
  rows,
}: {
  rows: AvgTicketByVisitRow[];
}) {
  const byVisitNumber = new Map(rows.map((r) => [r.visit_number, r]));

  return (
    <Card padding="sm" className="font-inter">
      <p className="mb-3 text-sm font-bold text-mh-ink">Ticket promedio (USD) por compra</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((visitNumber) => {
          const row = byVisitNumber.get(visitNumber);
          return (
            <div key={visitNumber} className="rounded-xl bg-mh-bg p-3">
              <p className="text-lg font-extrabold text-mh-ink">
                {row ? formatCurrency(row.avg_ticket_usd, "usd") : "—"}
              </p>
              <p className="text-xs font-medium text-mh-ink-muted">
                {VISIT_LABELS[visitNumber]}
              </p>
              {row && (
                <p className="text-xs text-mh-ink-muted">
                  {row.customers_count} cliente(s)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
