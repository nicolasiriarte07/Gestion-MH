import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit } from "@/lib/types";
import type { BreakdownRow } from "./BreakdownCard";
import VentasDashboard, { type Bucket, type SalesSummary } from "./VentasDashboard";

function defaultRange(): { from: string; to: string } {
  return { from: "2000-01-01", to: new Date().toISOString().slice(0, 10) };
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

type LetterRow = { receipt_letter: string; total_ars: number; line_count: number };
type BusinessUnitRow = {
  business_unit_id: string | null;
  total_ars: number;
  line_count: number;
};
type CategoryRow = { category_raw: string; total_ars: number; line_count: number };
type PaymentRow = { payment_method: string; total_ars: number; line_count: number };

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const def = defaultRange();
  const from = params.from || def.from;
  const to = params.to || def.to;
  const bucket = pickBucket(from, to);

  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: byLetterData },
    { data: byBusinessUnitData },
    { data: byCategoryData },
    { data: byPaymentData },
    { data: timeseriesData },
    { data: businessUnits },
    { count: totalLines },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.rpc("sales_summary", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_receipt_letter", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_business_unit", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_category", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_payment_method", { from_date: from, to_date: to }),
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
    receipt_count: 0,
    unit_count: 0,
    line_count: 0,
  };

  const byLetterRows: BreakdownRow[] = ((byLetterData ?? []) as LetterRow[]).map(
    (r) => ({
      label: RECEIPT_LETTER_LABELS[r.receipt_letter] ?? r.receipt_letter,
      total_ars: r.total_ars,
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
    line_count: r.line_count,
  }));

  const byCategoryRows: BreakdownRow[] = (
    (byCategoryData ?? []) as CategoryRow[]
  ).map((r) => ({
    label: r.category_raw,
    total_ars: r.total_ars,
    line_count: r.line_count,
  }));

  const byPaymentRows: BreakdownRow[] = (
    (byPaymentData ?? []) as PaymentRow[]
  ).map((r) => ({
    label: r.payment_method,
    total_ars: r.total_ars,
    line_count: r.line_count,
  }));

  return (
    <VentasDashboard
      totalLines={totalLines ?? 0}
      pendingCount={pendingCount ?? 0}
      from={from}
      to={to}
      bucket={bucket}
      summary={summary}
      byLetterRows={byLetterRows}
      byBusinessUnitRows={byBusinessUnitRows}
      byCategoryRows={byCategoryRows}
      byPaymentRows={byPaymentRows}
      timeseries={timeseriesData ?? []}
    />
  );
}
