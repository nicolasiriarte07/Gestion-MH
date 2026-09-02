import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Wallet,
  ShoppingBag,
  Receipt,
  Package,
  Users,
  Upload,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { BUSINESS_UNIT_COLORS } from "@/lib/businessUnitColors";
import IconTile, { type IconTone } from "@/components/ds/IconTile";
import PeriodFilter from "./PeriodFilter";
import MetricControls, { type Metric, type Currency } from "./MetricControls";
import CompareControls, { type CompareMode } from "./CompareControls";
import { VentasBreakdownCard } from "./VentasBreakdownCard";
import { PieChart } from "./PieChart";
import { WeekdayChart, type WeekdayRow } from "./WeekdayChart";
import { TimeSeriesChart, type TimeSeriesRow } from "./TimeSeriesChart";
import YearComparisonChart from "./YearComparisonChart";
import { TopCustomersCard } from "./TopCustomersCard";
import type { BreakdownRow } from "./BreakdownCard";

export type Bucket = "day" | "week" | "month";

export type SalesSummary = {
  total_ars: number;
  total_usd: number;
  line_count: number;
  unit_count: number;
  unique_customers: number;
};

// undefined => no hay comparación habilitada, no se muestra nada.
// null => hay comparación pero el período anterior no tiene datos
// (dividir por cero no tiene un "% de cambio" con sentido).
function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (delta === undefined || delta === null) return null;
  const rounded = Math.round(delta);
  const isPositive = rounded > 0;
  const isNegative = rounded < 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
        isPositive
          ? "text-emerald-600"
          : isNegative
            ? "text-red-500"
            : "text-mh-ink-muted"
      }`}
    >
      {isPositive && <ArrowUp size={14} />}
      {isNegative && <ArrowDown size={14} />}
      {Math.abs(rounded)}%
    </span>
  );
}

function StatTile({
  icon,
  tone,
  label,
  value,
  delta,
}: {
  icon: LucideIcon;
  tone: IconTone;
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="font-inter min-w-0 rounded-2xl border border-mh-border bg-mh-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4">
        <IconTile icon={icon} tone={tone} />
        <p className="text-sm font-medium text-mh-ink-muted">{label}</p>
      </div>
      <p className="mt-4 text-[2rem] leading-none font-extrabold tracking-tight text-mh-ink">
        {value}
      </p>
      {(delta ?? null) !== null && delta !== undefined && (
        <div className="mt-3">
          <DeltaBadge delta={delta} />
        </div>
      )}
    </div>
  );
}

export default function VentasDashboard({
  totalLines,
  pendingCount,
  from,
  to,
  bucket,
  metric,
  currency,
  compareEnabled,
  compareMode,
  compareFrom,
  compareTo,
  summary,
  compareSummary,
  byLetterRows,
  byBusinessUnitRows,
  byCategoryRows,
  byProductRows,
  byPaymentRows,
  byWeekdayRows,
  byCustomerRows,
  timeseries,
  currentYear,
  previousYear,
  currentYearMonthly,
  previousYearMonthly,
}: {
  totalLines: number;
  pendingCount: number;
  from: string;
  to: string;
  bucket: Bucket;
  metric: Metric;
  currency: Currency;
  compareEnabled: boolean;
  compareMode: CompareMode;
  compareFrom?: string;
  compareTo?: string;
  summary: SalesSummary;
  compareSummary: SalesSummary | null;
  byLetterRows: BreakdownRow[];
  byBusinessUnitRows: BreakdownRow[];
  byCategoryRows: BreakdownRow[];
  byProductRows: BreakdownRow[];
  byPaymentRows: BreakdownRow[];
  byWeekdayRows: WeekdayRow[];
  byCustomerRows: BreakdownRow[];
  timeseries: TimeSeriesRow[];
  currentYear: number;
  previousYear: number;
  currentYearMonthly: number[];
  previousYearMonthly: number[];
}) {
  const total = currency === "usd" ? summary.total_usd : summary.total_ars;
  const avgTicket = summary.line_count > 0 ? total / summary.line_count : 0;

  const compareTotal = compareSummary
    ? currency === "usd"
      ? compareSummary.total_usd
      : compareSummary.total_ars
    : null;
  const compareAvgTicket =
    compareSummary && compareSummary.line_count > 0
      ? (compareTotal ?? 0) / compareSummary.line_count
      : null;

  const deltas = compareSummary
    ? {
        total: percentDelta(total, compareTotal ?? 0),
        lineCount: percentDelta(summary.line_count, compareSummary.line_count),
        avgTicket:
          compareAvgTicket !== null
            ? percentDelta(avgTicket, compareAvgTicket)
            : null,
        unitCount: percentDelta(summary.unit_count, compareSummary.unit_count),
        uniqueCustomers: percentDelta(
          summary.unique_customers,
          compareSummary.unique_customers
        ),
      }
    : null;

  return (
    <div className="font-inter space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
            Ventas
          </h1>
          <p className="mt-1 text-sm font-medium text-mh-ink-muted">
            {totalLines} línea(s) de venta importadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ventas/revisar"
            className="flex items-center gap-1.5 rounded-xl border border-mh-border bg-white px-4 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50"
          >
            <ListChecks size={16} />
            Revisar coincidencias
          </Link>
          <Link
            href="/ventas/import"
            className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
          >
            <Upload size={16} />
            Importar ventas
          </Link>
        </div>
      </div>

      {!totalLines ? (
        <div className="rounded-2xl border border-dashed border-mh-border bg-mh-surface p-10 text-center text-sm text-mh-ink-muted">
          Todavía no importaste ningún histórico de ventas.{" "}
          <Link href="/ventas/import" className="font-semibold text-mh-pink hover:text-mh-pink-dark">
            Importar ahora
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <PeriodFilter from={from} to={to} />
            <MetricControls metric={metric} currency={currency} />
            <CompareControls
              enabled={compareEnabled}
              mode={compareMode}
              compareFrom={compareFrom}
              compareTo={compareTo}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile
              icon={Wallet}
              tone="pink"
              label="Total vendido"
              value={formatCurrency(total, currency)}
              delta={deltas?.total}
            />
            <StatTile
              icon={ShoppingBag}
              tone="blue"
              label="Cantidad de ventas"
              value={String(summary.line_count)}
              delta={deltas?.lineCount}
            />
            <StatTile
              icon={Receipt}
              tone="blue-light"
              label="Ticket promedio"
              value={formatCurrency(avgTicket, currency)}
              delta={deltas?.avgTicket}
            />
            <StatTile
              icon={Package}
              tone="gray"
              label="Unidades vendidas"
              value={String(Math.round(summary.unit_count))}
              delta={deltas?.unitCount}
            />
            <StatTile
              icon={Users}
              tone="pink"
              label="Clientes únicos"
              value={String(summary.unique_customers)}
              delta={deltas?.uniqueCustomers}
            />
          </div>

          <TimeSeriesChart
            rows={timeseries}
            bucket={bucket}
            metric={metric}
            currency={currency}
          />

          <YearComparisonChart
            currentYear={currentYear}
            previousYear={previousYear}
            currentYearMonthly={currentYearMonthly}
            previousYearMonthly={previousYearMonthly}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PieChart
              title="Por tipo de comprobante"
              rows={byLetterRows}
              metric={metric}
              currency={currency}
            />
            <WeekdayChart rows={byWeekdayRows} metric={metric} currency={currency} />
            <PieChart
              title="Por unidad de negocio"
              rows={byBusinessUnitRows}
              metric={metric}
              currency={currency}
              colorMap={BUSINESS_UNIT_COLORS}
            />
            <VentasBreakdownCard
              title="Por categoría"
              rows={byCategoryRows}
              metric={metric}
              currency={currency}
            />
            <VentasBreakdownCard
              title="Por producto"
              rows={byProductRows}
              metric={metric}
              currency={currency}
            />
            <PieChart
              title="Por forma de pago"
              rows={byPaymentRows}
              metric={metric}
              currency={currency}
            />
            <TopCustomersCard
              rows={byCustomerRows}
              metric={metric}
              currency={currency}
            />
          </div>

          {pendingCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
              {pendingCount} línea(s) de venta todavía no están vinculadas a
              un producto del inventario.{" "}
              <Link href="/ventas/revisar" className="font-semibold underline">
                Revisar coincidencias
              </Link>
              .
            </div>
          )}
        </>
      )}
    </div>
  );
}
