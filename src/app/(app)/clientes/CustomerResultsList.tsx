import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No se encontraron clientes que coincidan con &quot;{query}&quot;.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
        {matches.length} cliente(s) encontrados
      </div>
      <div className="divide-y divide-slate-100">
        {matches.map((m) => (
          <Link
            key={m.customer_name}
            href={`/clientes?q=${encodeURIComponent(query)}&customer=${encodeURIComponent(m.customer_name)}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {m.customer_name}
              </p>
              <p className="text-xs text-slate-500">
                {m.line_count} línea(s) · desde {m.first_sale_date} hasta{" "}
                {m.last_sale_date}
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-slate-900">
              {formatCurrency(m.total_ars, "ars")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
