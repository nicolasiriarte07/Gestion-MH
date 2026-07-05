import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import PeriodFilter from "./PeriodFilter";
import MetricControls, { type Metric, type Currency } from "./MetricControls";
import CompareControls, { type CompareMode } from "./CompareControls";
import { BreakdownCard, type BreakdownRow } from "./BreakdownCard";
import { PieChart } from "./PieChart";
import { WeekdayChart, type WeekdayRow } from "./WeekdayChart";
import { TimeSeriesChart, type TimeSeriesRow } from "./TimeSeriesChart";
import { TopCustomersCard } from "./TopCustomersCard";

// Colores fijos de marca para las dos unidades de negocio (ver skill de
// dataviz para el resto de la paleta categórica/secuencial).
const BUSINESS_UNIT_COLORS: Record<string, string> = {
  "MUNDO HOGAR": "#ec1e79",
  "EQUIPAMIENTOS MH": "#7c3aed",
};

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
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive
          ? "text-green-600"
          : isNegative
            ? "text-red-600"
            : "text-slate-400"
      }`}
    >
      {isPositive && <ArrowUp size={12} />}
      {isNegative && <ArrowDown size={12} />}
      {Math.abs(rounded)}%
    </span>
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <DeltaBadge delta={delta} />
      </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">
            {totalLines} línea(s) de venta importadas
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ventas/revisar"
            className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Revisar coincidencias
          </Link>
          <Link
            href="/ventas/import"
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Importar ventas
          </Link>
        </div>
      </div>

      {!totalLines ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Todavía no importaste ningún histórico de ventas.{" "}
          <Link href="/ventas/import" className="text-brand underline">
            Importar ahora
          </Link>
        </div>
      ) : (
        <>
          <PeriodFilter from={from} to={to} />
          <MetricControls metric={metric} currency={currency} />
          <CompareControls
            enabled={compareEnabled}
            mode={compareMode}
            compareFrom={compareFrom}
            compareTo={compareTo}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Total vendido"
              value={formatCurrency(total, currency)}
              delta={deltas?.total}
            />
            <StatTile
              label="Cantidad de ventas"
              value={String(summary.line_count)}
              delta={deltas?.lineCount}
            />
            <StatTile
              label="Ticket promedio"
              value={formatCurrency(avgTicket, currency)}
              delta={deltas?.avgTicket}
            />
            <StatTile
              label="Unidades vendidas"
              value={String(Math.round(summary.unit_count))}
              delta={deltas?.unitCount}
            />
            <StatTile
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
            <BreakdownCard
              title="Por categoría"
              rows={byCategoryRows}
              colorMode="sequential"
              metric={metric}
              currency={currency}
            />
            <BreakdownCard
              title="Por producto"
              rows={byProductRows}
              colorMode="sequential"
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
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {pendingCount} línea(s) de venta todavía no están vinculadas a
              un producto del inventario.{" "}
              <Link href="/ventas/revisar" className="underline">
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
