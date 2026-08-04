import { createClient } from "@/lib/supabase/server";
import { previousMonthRange, thisMonthRange } from "@/lib/dates";
import type { BusinessUnit } from "@/lib/types";
import type { KpiDelta } from "@/components/ds/KpiCard";
import type { DonutRow } from "@/components/ds/Donut";
import type { BarRow } from "@/components/ds/MiniBarChart";
import InicioHeader from "./InicioHeader";
import InicioKpis from "./InicioKpis";
import InicioSalesChart, { type DailySalesRow } from "./InicioSalesChart";
import InicioTopCustomers, { type TopCustomerRow } from "./InicioTopCustomers";
import InicioBreakdownRow from "./InicioBreakdownRow";

const LOW_STOCK_THRESHOLD = 1;

const WEEKDAY_ORDER = [
  { label: "lunes", short: "Lun" },
  { label: "martes", short: "Mar" },
  { label: "miércoles", short: "Mié" },
  { label: "jueves", short: "Jue" },
  { label: "viernes", short: "Vie" },
  { label: "sábado", short: "Sáb" },
  { label: "domingo", short: "Dom" },
];

const RECEIPT_LETTER_LABELS: Record<string, string> = {
  A: "A (sin IVA)",
  B: "B (consumidor final)",
  X: "X (en negro)",
};

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

type SalesSummary = {
  total_ars: number;
  total_usd: number;
  line_count: number;
  unit_count: number;
  unique_customers: number;
};

type TimeSeriesRow = { bucket_start: string; total_ars: number; line_count: number };
type WeekdayRpcRow = { weekday_label: string; sort_order: number; total_ars: number };
type LetterRpcRow = { receipt_letter: string; total_ars: number };
type BusinessUnitRpcRow = { business_unit_id: string | null; total_ars: number };
type CustomerRpcRow = { customer_name: string; total_ars: number };

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Mismo largo de días que el período elegido, inmediatamente antes (ej.
// julio completo -> junio completo). Igual criterio que usa Ventas.
function computeCompareRange(from: string, to: string): { from: string; to: string } {
  const fromD = new Date(`${from}T00:00:00Z`);
  const toD = new Date(`${to}T00:00:00Z`);
  const durationMs = toD.getTime() - fromD.getTime();
  const prevTo = new Date(fromD.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: toISO(prevFrom), to: toISO(prevTo) };
}

function computeDelta(current: number, previous: number, label: string): KpiDelta | undefined {
  if (previous <= 0) return undefined;
  return { pct: ((current - previous) / previous) * 100, label };
}

// "vs Junio 2026" si el período de comparación es un mes calendario
// completo; si no, "vs 01/06 - 30/06".
function formatCompareLabel(from: string, to: string): string {
  const fromD = new Date(`${from}T00:00:00`);
  const toD = new Date(`${to}T00:00:00`);
  const isFullMonth =
    fromD.getDate() === 1 &&
    toD.getMonth() === fromD.getMonth() &&
    toD.getFullYear() === fromD.getFullYear() &&
    toD.getDate() === new Date(fromD.getFullYear(), fromD.getMonth() + 1, 0).getDate();

  if (isFullMonth) {
    const name = MONTH_NAMES[fromD.getMonth()];
    return `vs ${name.charAt(0).toUpperCase()}${name.slice(1)} ${fromD.getFullYear()}`;
  }
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  return `vs ${fmt(fromD)} - ${fmt(toD)}`;
}

function last30DaysRange(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  return { from: toISO(from), to: toISO(today) };
}

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const def = previousMonthRange();
  const from = params.from || def.from;
  const to = params.to || def.to;
  const compareRange = computeCompareRange(from, to);
  const thisMonth = thisMonthRange();
  const last30 = last30DaysRange();

  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: compareSummaryData },
    { data: timeseriesData },
    { data: weekdayData },
    { data: letterData },
    { data: businessUnitData },
    { data: customerData },
    { data: businessUnits },
    { count: lowStockCount },
    { data: marketingPosts },
  ] = await Promise.all([
    supabase.rpc("sales_summary", { from_date: from, to_date: to }),
    supabase.rpc("sales_summary", {
      from_date: compareRange.from,
      to_date: compareRange.to,
    }),
    supabase.rpc("sales_timeseries", {
      from_date: last30.from,
      to_date: last30.to,
      bucket: "day",
    }),
    supabase.rpc("sales_by_weekday", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_receipt_letter", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_business_unit", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_customer", { from_date: from, to_date: to }),
    supabase.from("business_units").select("id, name"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock", LOW_STOCK_THRESHOLD),
    supabase
      .from("marketing_posts")
      .select("investment_ars")
      .gte("publish_date", thisMonth.from)
      .lte("publish_date", thisMonth.to),
  ]);

  const summary: SalesSummary = summaryData?.[0] ?? {
    total_ars: 0,
    total_usd: 0,
    line_count: 0,
    unit_count: 0,
    unique_customers: 0,
  };
  const compareSummary: SalesSummary = compareSummaryData?.[0] ?? {
    total_ars: 0,
    total_usd: 0,
    line_count: 0,
    unit_count: 0,
    unique_customers: 0,
  };

  const compareLabel = formatCompareLabel(compareRange.from, compareRange.to);

  const dailySalesRows: DailySalesRow[] = ((timeseriesData ?? []) as TimeSeriesRow[]).map(
    (r) => ({ date: r.bucket_start, total_ars: r.total_ars, line_count: r.line_count })
  );

  const weekdayByLabel = new Map(
    ((weekdayData ?? []) as WeekdayRpcRow[]).map((r) => [
      r.weekday_label.trim().toLowerCase(),
      r.total_ars,
    ])
  );
  const byWeekday: BarRow[] = WEEKDAY_ORDER.map((w) => ({
    label: w.short,
    value: weekdayByLabel.get(w.label) ?? 0,
  }));

  const byReceiptLetter: DonutRow[] = ((letterData ?? []) as LetterRpcRow[])
    .map((r) => ({
      label: RECEIPT_LETTER_LABELS[r.receipt_letter] ?? r.receipt_letter,
      value: r.total_ars,
    }))
    .sort((a, b) => b.value - a.value);

  const businessUnitName = new Map(
    ((businessUnits ?? []) as BusinessUnit[]).map((bu) => [bu.id, bu.name])
  );
  const byBusinessUnit: DonutRow[] = ((businessUnitData ?? []) as BusinessUnitRpcRow[])
    .map((r) => ({
      label: r.business_unit_id
        ? (businessUnitName.get(r.business_unit_id) ?? "Desconocida")
        : "Sin asignar",
      value: r.total_ars,
    }))
    .sort((a, b) => b.value - a.value);

  const topCustomers: TopCustomerRow[] = ((customerData ?? []) as CustomerRpcRow[])
    .map((r) => ({ customer_name: r.customer_name, total_ars: r.total_ars }))
    .sort((a, b) => b.total_ars - a.total_ars);

  const marketingInvestment = (
    (marketingPosts ?? []) as { investment_ars: number }[]
  ).reduce((sum, r) => sum + r.investment_ars, 0);

  const avgTicket = summary.line_count > 0 ? summary.total_ars / summary.line_count : 0;

  return (
    <div className="font-inter space-y-10">
      <InicioHeader from={from} to={to} />

      <InicioKpis
        totalArs={summary.total_ars}
        totalArsDelta={computeDelta(summary.total_ars, compareSummary.total_ars, compareLabel)}
        salesCount={summary.line_count}
        salesCountDelta={computeDelta(summary.line_count, compareSummary.line_count, compareLabel)}
        lowStockCount={lowStockCount ?? 0}
        marketingInvestment={marketingInvestment}
        periodLabel="Este mes"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InicioSalesChart
            rows={dailySalesRows}
            totalArs={summary.total_ars}
            avgTicket={avgTicket}
            unitCount={summary.unit_count}
            uniqueCustomers={summary.unique_customers}
          />
        </div>
        <div className="lg:col-span-2">
          <InicioTopCustomers rows={topCustomers} />
        </div>
      </div>

      <InicioBreakdownRow
        byReceiptLetter={byReceiptLetter}
        byWeekday={byWeekday}
        byBusinessUnit={byBusinessUnit}
      />
    </div>
  );
}
