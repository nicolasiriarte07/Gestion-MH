import Link from "next/link";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";

export type TopCustomerRow = {
  customer_name: string;
  total_ars: number;
};

export default function InicioTopCustomers({ rows }: { rows: TopCustomerRow[] }) {
  const top = rows.slice(0, 10);
  const max = Math.max(1, ...top.map((r) => r.total_ars));

  return (
    <Card className="font-inter">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-mh-ink">Top 10 clientes</p>
        <Link
          href="/clientes"
          className="text-sm font-semibold text-mh-pink hover:text-mh-pink-dark"
        >
          Ver todos
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="mt-6 text-sm text-mh-ink-muted">Sin datos todavía.</p>
      ) : (
        <div className="mt-5 space-y-3.5">
          {top.map((row, i) => (
            <div key={row.customer_name} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-sm font-semibold text-mh-ink-muted">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-mh-ink">
                  {row.customer_name}
                </p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-mh-pink-light">
                  <div
                    className="h-1.5 rounded-full bg-mh-pink"
                    style={{ width: `${(row.total_ars / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-mh-ink">
                {formatCurrency(row.total_ars)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
