import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit } from "@/lib/types";
import CustomerSearch from "./CustomerSearch";
import CustomerResultsList, { type SearchMatch } from "./CustomerResultsList";
import CustomerHistoryView, { type HistoryRow } from "./CustomerHistoryView";
import ClientesSummaryMetrics from "./ClientesSummaryMetrics";

type CustomerMetricsSummary = {
  unique_customers: number;
  repeat_purchase_pct: number;
  avg_recency_days: number;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; customer?: string }>;
}) {
  const { q, customer } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const { data: summaryData } = await supabase.rpc("customer_metrics_summary");
  const summary = ((summaryData as CustomerMetricsSummary[] | null)?.[0] ?? {
    unique_customers: 0,
    repeat_purchase_pct: 0,
    avg_recency_days: 0,
  }) as CustomerMetricsSummary;

  if (!query && !customer) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
        <ClientesSummaryMetrics
          uniqueCustomers={summary.unique_customers}
          repeatPurchasePct={summary.repeat_purchase_pct}
          avgRecencyDays={summary.avg_recency_days}
        />
        <CustomerSearch initialQuery="" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          <Users className="text-slate-300" size={32} />
          <p>Buscá un cliente por nombre para ver su historial de compras.</p>
        </div>
      </div>
    );
  }

  // Con `customer` ya sabemos a quién mostrar en detalle. Sin `customer`,
  // buscamos coincidencias por `q`: si hay una sola, se muestra el detalle
  // directo; si hay varias, se listan para desambiguar.
  let selectedCustomer = customer?.trim() ?? "";
  let matches: SearchMatch[] = [];

  if (!selectedCustomer) {
    const { data } = await supabase.rpc("search_customers", {
      search_term: query,
    });
    matches = (data ?? []) as SearchMatch[];
    if (matches.length === 1) {
      selectedCustomer = matches[0].customer_name;
    }
  }

  if (selectedCustomer) {
    const [{ data: historyData }, { data: businessUnits }] = await Promise.all([
      supabase.rpc("customer_sales_history", {
        customer_name_exact: selectedCustomer,
      }),
      supabase.from("business_units").select("id, name"),
    ]);

    const businessUnitMap = new Map(
      ((businessUnits ?? []) as BusinessUnit[]).map((bu) => [bu.id, bu.name])
    );
    const businessUnitName = (id: string | null) =>
      id ? (businessUnitMap.get(id) ?? "Desconocida") : "";

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
        <ClientesSummaryMetrics
          uniqueCustomers={summary.unique_customers}
          repeatPurchasePct={summary.repeat_purchase_pct}
          avgRecencyDays={summary.avg_recency_days}
        />
        <CustomerSearch initialQuery={query} />
        <CustomerHistoryView
          customerName={selectedCustomer}
          query={query}
          history={(historyData ?? []) as HistoryRow[]}
          businessUnitName={businessUnitName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
      <ClientesSummaryMetrics
        uniqueCustomers={summary.unique_customers}
        repeatPurchasePct={summary.repeat_purchase_pct}
        avgRecencyDays={summary.avg_recency_days}
      />
      <CustomerSearch initialQuery={query} />
      <CustomerResultsList query={query} matches={matches} />
    </div>
  );
}
