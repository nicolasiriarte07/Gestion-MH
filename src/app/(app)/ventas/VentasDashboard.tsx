import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import PeriodFilter from "./PeriodFilter";
import MetricControls, { type Metric, type Currency } from "./MetricControls";
import { BreakdownCard, type BreakdownRow } from "./BreakdownCard";
import { PieChart } from "./PieChart";
import { WeekdayChart, type WeekdayRow } from "./WeekdayChart";
import { TimeSeriesChart, type TimeSeriesRow } from "./TimeSeriesChart";

export type Bucket = "day" | "week" | "month";

export type SalesSummary = {
  total_ars: number;
  total_usd: number;
  line_count: number;
  unit_count: number;
  unique_customers: number;
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
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
  summary,
  byLetterRows,
  byBusinessUnitRows,
  byCategoryRows,
  byPaymentRows,
  byWeekdayRows,
  timeseries,
}: {
  totalLines: number;
  pendingCount: number;
  from: string;
  to: string;
  bucket: Bucket;
  metric: Metric;
  currency: Currency;
  summary: SalesSummary;
  byLetterRows: BreakdownRow[];
  byBusinessUnitRows: BreakdownRow[];
  byCategoryRows: BreakdownRow[];
  byPaymentRows: BreakdownRow[];
  byWeekdayRows: WeekdayRow[];
  timeseries: TimeSeriesRow[];
}) {
  const total = currency === "usd" ? summary.total_usd : summary.total_ars;
  const avgTicket = summary.line_count > 0 ? total / summary.line_count : 0;

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
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Todavía no importaste ningún histórico de ventas.{" "}
          <Link href="/ventas/import" className="text-brand underline">
            Importar ahora
          </Link>
        </div>
      ) : (
        <>
          <PeriodFilter from={from} to={to} />
          <MetricControls metric={metric} currency={currency} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Total vendido"
              value={formatCurrency(total, currency)}
            />
            <StatTile
              label="Cantidad de ventas"
              value={String(summary.line_count)}
            />
            <StatTile
              label="Ticket promedio"
              value={formatCurrency(avgTicket, currency)}
            />
            <StatTile
              label="Unidades vendidas"
              value={String(Math.round(summary.unit_count))}
            />
            <StatTile
              label="Clientes únicos"
              value={String(summary.unique_customers)}
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
            <BreakdownCard
              title="Por unidad de negocio"
              rows={byBusinessUnitRows}
              colorMode="categorical"
              metric={metric}
              currency={currency}
            />
            <BreakdownCard
              title="Por categoría"
              rows={byCategoryRows}
              colorMode="sequential"
              metric={metric}
              currency={currency}
            />
            <BreakdownCard
              title="Por forma de pago"
              rows={byPaymentRows}
              colorMode="categorical"
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
