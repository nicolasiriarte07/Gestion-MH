import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit } from "@/lib/types";
import type { BreakdownRow } from "./BreakdownCard";
import type { Metric, Currency } from "./MetricControls";
import type { CompareMode } from "./CompareControls";
import type { WeekdayRow } from "./WeekdayChart";
import type { TimeSeriesRow } from "./TimeSeriesChart";
import VentasDashboard, { type Bucket, type SalesSummary } from "./VentasDashboard";

// Por defecto, el dashboard arranca mostrando el mes calendario anterior
// completo (ej. si hoy es cualquier día de julio, muestra junio entero),
// no todo el histórico.
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const firstOfThisMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth - 1);
  const firstOfPrevMonth = new Date(
    Date.UTC(lastOfPrevMonth.getUTCFullYear(), lastOfPrevMonth.getUTCMonth(), 1)
  );
  return { from: toISO(firstOfPrevMonth), to: toISO(lastOfPrevMonth) };
}

// "previous": mismo largo de días, inmediatamente antes del período
// actual (ej. últimos 30 días -> los 30 días anteriores a esos).
// "year": mismo rango de fechas, un año antes.
function computeCompareRange(
  from: string,
  to: string,
  mode: CompareMode
): { from: string; to: string } {
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const fromD = new Date(`${from}T00:00:00Z`);
  const toD = new Date(`${to}T00:00:00Z`);

  if (mode === "year") {
    const prevFrom = new Date(fromD);
    prevFrom.setUTCFullYear(prevFrom.getUTCFullYear() - 1);
    const prevTo = new Date(toD);
    prevTo.setUTCFullYear(prevTo.getUTCFullYear() - 1);
    return { from: toISO(prevFrom), to: toISO(prevTo) };
  }

  const durationMs = toD.getTime() - fromD.getTime();
  const prevTo = new Date(fromD.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: toISO(prevFrom), to: toISO(prevTo) };
}

function pickBucket(from: string, to: string): Bucket {
  const days =
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
    86_400_000;
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

const RECEIPT_LETTER_LABELS: Record<string, string> = {
  A: "A (sin IVA)",
  B: "B (consumidor final)",
  X: "X (en negro)",
};

type LetterRow = {
  receipt_letter: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};
type BusinessUnitRow = {
  business_unit_id: string | null;
  total_ars: number;
  total_usd: number;
  line_count: number;
};
type CategoryRow = {
  category_raw: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};
type PaymentRow = {
  payment_method: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};
type ProductRow = {
  product_description: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};
type CustomerRow = {
  customer_name: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    metric?: string;
    currency?: string;
    compare?: string;
    compareMode?: string;
  }>;
}) {
  const params = await searchParams;
  const def = defaultRange();
  const from = params.from || def.from;
  const to = params.to || def.to;
  const bucket = pickBucket(from, to);
  const metric: Metric = params.metric === "ventas" ? "ventas" : "facturacion";
  const currency: Currency = params.currency === "usd" ? "usd" : "ars";
  const compareEnabled = params.compare !== "off";
  const compareMode: CompareMode = params.compareMode === "year" ? "year" : "previous";
  const compareRange = compareEnabled
    ? computeCompareRange(from, to, compareMode)
    : null;

  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: compareSummaryData },
    { data: byLetterData },
    { data: byBusinessUnitData },
    { data: byCategoryData },
    { data: byProductData },
    { data: byPaymentData },
    { data: byWeekdayData },
    { data: byCustomerData },
    { data: timeseriesData },
    { data: businessUnits },
    { count: totalLines },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.rpc("sales_summary", { from_date: from, to_date: to }),
    compareRange
      ? supabase.rpc("sales_summary", {
          from_date: compareRange.from,
          to_date: compareRange.to,
        })
      : Promise.resolve({ data: null }),
    supabase.rpc("sales_by_receipt_letter", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_business_unit", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_category", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_product", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_payment_method", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_weekday", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_customer", { from_date: from, to_date: to }),
    supabase.rpc("sales_timeseries", {
      from_date: from,
      to_date: to,
      bucket,
    }),
    supabase.from("business_units").select("id, name"),
    supabase.from("sale_items").select("id", { count: "exact", head: true }),
    supabase
      .from("sale_items")
      .select("id", { count: "exact", head: true })
      .eq("match_status", "pending"),
  ]);

  const summary: SalesSummary = summaryData?.[0] ?? {
    total_ars: 0,
    total_usd: 0,
    line_count: 0,
    unit_count: 0,
    unique_customers: 0,
  };

  const compareSummary: SalesSummary | null = compareRange
    ? (compareSummaryData?.[0] ?? {
        total_ars: 0,
        total_usd: 0,
        line_count: 0,
        unit_count: 0,
        unique_customers: 0,
      })
    : null;

  const byLetterRows: BreakdownRow[] = ((byLetterData ?? []) as LetterRow[]).map(
    (r) => ({
      label: RECEIPT_LETTER_LABELS[r.receipt_letter] ?? r.receipt_letter,
      total_ars: r.total_ars,
      total_usd: r.total_usd,
      line_count: r.line_count,
    })
  );

  const businessUnitName = new Map(
    ((businessUnits ?? []) as BusinessUnit[]).map((bu) => [bu.id, bu.name])
  );
  const byBusinessUnitRows: BreakdownRow[] = (
    (byBusinessUnitData ?? []) as BusinessUnitRow[]
  ).map((r) => ({
    label: r.business_unit_id
      ? (businessUnitName.get(r.business_unit_id) ?? "Desconocida")
      : "Sin asignar",
    total_ars: r.total_ars,
    total_usd: r.total_usd,
    line_count: r.line_count,
  }));

  const byCategoryRows: BreakdownRow[] = (
    (byCategoryData ?? []) as CategoryRow[]
  ).map((r) => ({
    label: r.category_raw,
    total_ars: r.total_ars,
    total_usd: r.total_usd,
    line_count: r.line_count,
  }));

  const byProductRows: BreakdownRow[] = (
    (byProductData ?? []) as ProductRow[]
  ).map((r) => ({
    label: r.product_description,
    total_ars: r.total_ars,
    total_usd: r.total_usd,
    line_count: r.line_count,
  }));

  const byPaymentRows: BreakdownRow[] = (
    (byPaymentData ?? []) as PaymentRow[]
  ).map((r) => ({
    label: r.payment_method,
    total_ars: r.total_ars,
    total_usd: r.total_usd,
    line_count: r.line_count,
  }));

  const byWeekdayRows: WeekdayRow[] = (byWeekdayData ?? []) as WeekdayRow[];

  const byCustomerRows: BreakdownRow[] = (
    (byCustomerData ?? []) as CustomerRow[]
  ).map((r) => ({
    label: r.customer_name,
    total_ars: r.total_ars,
    total_usd: r.total_usd,
    line_count: r.line_count,
  }));

  return (
    <VentasDashboard
      totalLines={totalLines ?? 0}
      pendingCount={pendingCount ?? 0}
      from={from}
      to={to}
      bucket={bucket}
      metric={metric}
      currency={currency}
      compareEnabled={compareEnabled}
      compareMode={compareMode}
      compareFrom={compareRange?.from}
      compareTo={compareRange?.to}
      summary={summary}
      compareSummary={compareSummary}
      byLetterRows={byLetterRows}
      byBusinessUnitRows={byBusinessUnitRows}
      byCategoryRows={byCategoryRows}
      byProductRows={byProductRows}
      byPaymentRows={byPaymentRows}
      byWeekdayRows={byWeekdayRows}
      byCustomerRows={byCustomerRows}
      timeseries={(timeseriesData ?? []) as TimeSeriesRow[]}
    />
  );
}
