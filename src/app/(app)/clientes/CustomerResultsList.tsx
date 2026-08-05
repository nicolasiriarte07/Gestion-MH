import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import Card from "@/components/ds/Card";
import Avatar from "@/components/ds/Avatar";

export type SearchMatch = {
  customer_name: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
  first_sale_date: string;
  last_sale_date: string;
};

export default function CustomerResultsList({
  query,
  matches,
}: {
  query: string;
  matches: SearchMatch[];
}) {
  if (matches.length === 0) {
    return (
      <div className="font-inter rounded-2xl border border-dashed border-mh-border bg-mh-surface p-8 text-center text-sm text-mh-ink-muted">
        No se encontraron clientes que coincidan con &quot;{query}&quot;.
      </div>
    );
  }

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="border-b border-mh-border px-5 py-3 text-sm font-bold text-mh-ink">
        {matches.length} cliente(s) encontrados
      </div>
      <div className="divide-y divide-mh-border/70">
        {matches.map((m) => (
          <Link
            key={m.customer_name}
            href={`/clientes?q=${encodeURIComponent(query)}&customer=${encodeURIComponent(m.customer_name)}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-mh-pink-light/40"
          >
            <Avatar name={m.customer_name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-mh-ink">
                {m.customer_name}
              </p>
              <p className="text-xs text-mh-ink-muted">
                {m.line_count} línea(s) · desde {m.first_sale_date} hasta{" "}
                {m.last_sale_date}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-mh-ink">
              {formatCurrency(m.total_ars, "ars")}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
