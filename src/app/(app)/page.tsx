import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { previousMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/currency";
import type { Brand, ContentType, Product } from "@/lib/types";
import type { BreakdownRow } from "./ventas/BreakdownCard";
import { TopCustomersCard } from "./ventas/TopCustomersCard";
import LowStockAlerts, { type LowStockRow } from "./inventario/LowStockAlerts";

const LOW_STOCK_THRESHOLD = 5;
const VELOCITY_WINDOW_DAYS = 90;
const LOW_STOCK_ALERT_LIMIT = 5;
const UPCOMING_MARKETING_LIMIT = 5;

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatMonthLabel(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  const name = MONTH_NAMES[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const CONTENT_LABELS: Record<ContentType, string> = {
  educacional: "Educacional",
  marca: "Marca",
  comercial: "Comercial",
};

type CustomerRow = {
  customer_name: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
};

type UpcomingPost = {
  id: string;
  concept: string;
  publish_date: string;
  content_type: ContentType | null;
};

function KpiTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}

export default async function ResumenPage() {
  const { from, to } = previousMonthRange();
  const monthLabel = formatMonthLabel(from);
  const today = todayISO();

  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: byCustomerData },
    { data: lowStockProducts },
    { data: velocityData },
    { data: brands },
    { count: lowStockCount },
    { data: marketingMonthPosts },
    { data: upcomingPosts },
  ] = await Promise.all([
    supabase.rpc("sales_summary", { from_date: from, to_date: to }),
    supabase.rpc("sales_by_customer", { from_date: from, to_date: to }),
    supabase.from("products").select("*").lte("stock", LOW_STOCK_THRESHOLD),
    supabase.rpc("product_sales_velocity", { days: VELOCITY_WINDOW_DAYS }),
    supabase.from("brands").select("id, name"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock", LOW_STOCK_THRESHOLD),
    supabase
      .from("marketing_posts")
      .select("investment_ars")
      .gte("publish_date", from)
      .lte("publish_date", to),
    supabase
      .from("marketing_posts")
      .select("id, concept, publish_date, content_type")
      .gte("publish_date", today)
      .order("publish_date", { ascending: true })
      .limit(UPCOMING_MARKETING_LIMIT),
  ]);

  const summary = summaryData?.[0] ?? { total_ars: 0, line_count: 0 };

  const byCustomerRows: BreakdownRow[] = ((byCustomerData ?? []) as CustomerRow[]).map(
    (r) => ({
      label: r.customer_name,
      total_ars: r.total_ars,
      total_usd: r.total_usd,
      line_count: r.line_count,
    })
  );

  const velocityByProduct = new Map(
    ((velocityData ?? []) as { product_id: string; units_sold: number }[]).map(
      (r) => [r.product_id, r.units_sold]
    )
  );
  const lowStockRows: LowStockRow[] = ((lowStockProducts ?? []) as Product[])
    .map((p) => ({ ...p, units_sold_90d: velocityByProduct.get(p.id) ?? 0 }))
    .sort((a, b) => b.units_sold_90d - a.units_sold_90d)
    .slice(0, LOW_STOCK_ALERT_LIMIT);

  const marketingInvestment = (
    (marketingMonthPosts ?? []) as { investment_ars: number }[]
  ).reduce((sum, r) => sum + r.investment_ars, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Resumen</h1>
        <p className="text-sm text-slate-500">Datos de {monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Total vendido"
          value={formatCurrency(summary.total_ars)}
          sublabel={monthLabel}
        />
        <KpiTile
          label="Cantidad de ventas"
          value={String(summary.line_count)}
          sublabel={monthLabel}
        />
        <KpiTile
          label="Productos con stock bajo"
          value={String(lowStockCount ?? 0)}
          sublabel="5 unidades o menos"
        />
        <KpiTile
          label="Inversión en marketing"
          value={formatCurrency(marketingInvestment)}
          sublabel={monthLabel}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LowStockAlerts rows={lowStockRows} brands={(brands ?? []) as Brand[]} />
        <TopCustomersCard rows={byCustomerRows} metric="facturacion" currency="ars" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Próximas acciones de marketing
          </p>
          <Link
            href="/marketing"
            className="text-xs font-medium text-brand underline"
          >
            Ver calendario completo
          </Link>
        </div>
        {(upcomingPosts ?? []).length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No hay acciones programadas próximamente.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {((upcomingPosts ?? []) as UpcomingPost[]).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                  {post.concept}
                </p>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  {post.content_type && (
                    <span>{CONTENT_LABELS[post.content_type]}</span>
                  )}
                  <span>{post.publish_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
