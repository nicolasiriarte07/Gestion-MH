import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { BusinessUnit } from "@/lib/types";
import { fetchClientesAggregate, classifyClientes } from "./aggregate";
import CustomerResultsList, { type SearchMatch } from "./CustomerResultsList";
import CustomerHistoryView, { type HistoryRow } from "./CustomerHistoryView";
import ClientesSummaryMetrics from "./ClientesSummaryMetrics";
import RecencyByVisitCard, { type RecencyByVisitRow } from "./RecencyByVisitCard";
import AvgTicketByVisitCard, {
  type AvgTicketByVisitRow,
} from "./AvgTicketByVisitCard";
import ClientesHeader from "./ClientesHeader";
import ClientesView from "./ClientesView";
import type { MovementRow } from "./ClientesBottomDashboard";

const EXCLUDED_NAME = "consumidor final";
const NEW_MOVEMENT_DAYS = 30;
const RECENT_SALES_LIMIT = 60;
const MOVEMENTS_LIMIT = 12;

type CustomerMetricsSummary = {
  unique_customers: number;
  repeat_purchase_pct: number;
  avg_recency_days: number;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const to = new Date(`${toISO}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; customer?: string }>;
}) {
  const { q, customer } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: recencyByVisitData },
    { data: avgTicketByVisitData },
  ] = await Promise.all([
    supabase.rpc("customer_metrics_summary"),
    supabase.rpc("customer_recency_by_visit"),
    supabase.rpc("customer_avg_ticket_usd_by_visit"),
  ]);
  const summary = ((summaryData as CustomerMetricsSummary[] | null)?.[0] ?? {
    unique_customers: 0,
    repeat_purchase_pct: 0,
    avg_recency_days: 0,
  }) as CustomerMetricsSummary;
  const recencyByVisit = (recencyByVisitData ?? []) as RecencyByVisitRow[];
  const avgTicketByVisit = (avgTicketByVisitData ??
    []) as AvgTicketByVisitRow[];

  const legacyMetrics = (
    <>
      <ClientesSummaryMetrics
        uniqueCustomers={summary.unique_customers}
        repeatPurchasePct={summary.repeat_purchase_pct}
        avgRecencyDays={summary.avg_recency_days}
      />
      <RecencyByVisitCard rows={recencyByVisit} />
      <AvgTicketByVisitCard rows={avgTicketByVisit} />
    </>
  );

  // Con `customer` ya sabemos a quién mostrar en detalle. Sin `customer`,
  // buscamos coincidencias por `q`: si hay una sola, se muestra el detalle
  // directo; si hay varias, se listan para desambiguar.
  let selectedCustomer = customer?.trim() ?? "";
  let matches: SearchMatch[] = [];

  if (query && !selectedCustomer) {
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
      <div className="font-inter space-y-8">
        <ClientesHeader subtitle="Ficha de cliente" />
        {legacyMetrics}
        <CustomerHistoryView
          customerName={selectedCustomer}
          query={query}
          history={(historyData ?? []) as HistoryRow[]}
          businessUnitName={businessUnitName}
        />
      </div>
    );
  }

  if (query) {
    return (
      <div className="font-inter space-y-8">
        <ClientesHeader subtitle={`Resultados para "${query}"`} />
        {legacyMetrics}
        <CustomerResultsList query={query} matches={matches} />
      </div>
    );
  }

  // Vista principal: se arma la lista completa de clientes agregando
  // sale_items por nombre (no existe una tabla customers), igual criterio
  // de exclusión de "Consumidor Final" que las métricas de arriba.
  const [aggregate, { data: monthSales }, { data: recentSales }] = await Promise.all([
    fetchClientesAggregate(supabase),
    fetchAllRows<{ subtotal_with_iva: number; customer_name: string | null }>(
      (from, to) =>
        supabase
          .from("sale_items")
          .select("subtotal_with_iva, customer_name")
          .gte("sale_date", `${todayISO().slice(0, 7)}-01`)
          .lte("sale_date", todayISO())
          .range(from, to)
    ),
    supabase
      .from("sale_items")
      .select("customer_name, sale_date")
      .order("sale_date", { ascending: false })
      .limit(RECENT_SALES_LIMIT),
  ]);

  const classified = classifyClientes(aggregate);

  const totalCount = summary.unique_customers;
  const newThisMonthThreshold = `${todayISO().slice(0, 7)}-01`;
  const newThisMonth = classified.filter(
    (r) => r.first_sale_date >= newThisMonthThreshold
  ).length;
  const activeCount = classified.filter((r) => r.status !== "inactivo").length;

  const revenueThisMonth = monthSales
    .filter((r) => {
      const name = r.customer_name?.trim();
      return name && name.toLowerCase() !== EXCLUDED_NAME;
    })
    .reduce((sum, r) => sum + r.subtotal_with_iva, 0);

  const totalRevenue = classified.reduce((s, r) => s + r.total_ars, 0);
  const totalLines = classified.reduce((s, r) => s + r.line_count, 0);
  const avgTicket = totalLines > 0 ? totalRevenue / totalLines : 0;

  const topClientes = [...classified]
    .sort((a, b) => b.total_ars - a.total_ars)
    .slice(0, 10)
    .map((r) => ({ label: r.customer_name, value: r.total_ars }));

  const inactiveClientes = classified
    .filter((r) => r.status === "inactivo")
    .sort((a, b) => b.total_ars - a.total_ars)
    .slice(0, 8)
    .map((r) => ({
      customer_name: r.customer_name,
      last_sale_date: r.last_sale_date,
      days_since: daysBetween(r.last_sale_date, todayISO()),
      total_ars: r.total_ars,
    }));

  // "Últimos movimientos": altas (primera compra reciente) + compras
  // recientes (visitas distintas, dedupe por cliente+fecha ya que varias
  // líneas el mismo día son una sola visita). No hay tabla de eventos
  // para clientes (a diferencia de supplier_history en Proveedores), así
  // que se arma a partir de sale_items — no hay "actualizaciones" ni
  // "notas" ni "cambios de datos" porque esos eventos no existen acá.
  const newMovements: MovementRow[] = classified
    .filter((r) => r.first_sale_date >= daysAgoISO(NEW_MOVEMENT_DAYS))
    .map((r) => ({
      id: `nuevo-${r.customer_name}`,
      type: "nuevo",
      customer_name: r.customer_name,
      date: r.first_sale_date,
      detail: "Cliente nuevo",
    }));

  const seenVisits = new Set<string>();
  const purchaseMovements: MovementRow[] = [];
  for (const row of recentSales ?? []) {
    const name = row.customer_name?.trim();
    if (!name || name.toLowerCase() === EXCLUDED_NAME) continue;
    const key = `${name}__${row.sale_date}`;
    if (seenVisits.has(key)) continue;
    seenVisits.add(key);
    purchaseMovements.push({
      id: `compra-${key}`,
      type: "compra",
      customer_name: name,
      date: row.sale_date,
      detail: "Compra registrada",
    });
  }

  const movements = [...newMovements, ...purchaseMovements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MOVEMENTS_LIMIT);

  return (
    <div className="font-inter space-y-8">
      <ClientesHeader subtitle={`${totalCount} cliente(s) identificados`} />
      {legacyMetrics}
      <ClientesView
        rows={classified}
        totalCount={totalCount}
        newThisMonth={newThisMonth}
        activeCount={activeCount}
        revenueThisMonth={revenueThisMonth}
        avgTicket={avgTicket}
        topClientes={topClientes}
        inactiveClientes={inactiveClientes}
        movements={movements}
      />
    </div>
  );
}
