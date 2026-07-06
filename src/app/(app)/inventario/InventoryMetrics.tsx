"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";

type Aggregation = "avg" | "median";

function average(values: number[]): number {
  return values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function aggregate(values: number[], mode: Aggregation): number {
  return mode === "median" ? median(values) : average(values);
}

function AggregationToggle({
  value,
  onChange,
}: {
  value: Aggregation;
  onChange: (v: Aggregation) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Aggregation)}
      className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[11px] font-medium text-slate-600 focus:border-brand focus:outline-none"
    >
      <option value="avg">Promedio</option>
      <option value="median">Mediana</option>
    </select>
  );
}

function StatCard({
  label,
  value,
  selector,
}: {
  label: string;
  value: string;
  selector?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium whitespace-nowrap text-slate-700">
          {label}
        </p>
        {selector}
      </div>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function InventoryMetrics({
  products,
}: {
  products: Product[];
}) {
  const [markupAgg, setMarkupAgg] = useState<Aggregation>("avg");
  const [cogsAgg, setCogsAgg] = useState<Aggregation>("avg");
  const [priceAgg, setPriceAgg] = useState<Aggregation>("avg");

  const metrics = useMemo(() => {
    // Markup y COGS se calculan sobre los mismos productos: los que
    // tienen Costo y P. Web cargados (> 0). Si a un producto le falta
    // alguno de los dos, no cuenta para ninguno de los dos.
    const withCompleteMetrics = products.filter(
      (p) => p.cost > 0 && p.price_web > 0
    );
    const markups = withCompleteMetrics.map(
      (p) => (p.price_web - p.cost) / p.cost
    );
    const cogsValues = withCompleteMetrics.map((p) => p.cost / p.price_web);
    // Dinero en inventario y Precio promedio se calculan con P. Contado
    // (no con Costo): la mayoría del catálogo todavía no tiene el Costo
    // cargado, así que usar Costo daría un número muy por debajo del real.
    const prices = products.map((p) => p.price_cash);
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.stock * p.price_cash,
      0
    );

    return {
      count: products.length,
      markups,
      cogsValues,
      prices,
      inventoryValue,
    };
  }, [products]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Cantidad de SKUs" value={String(metrics.count)} />
      <StatCard
        label="Markup"
        value={`${(aggregate(metrics.markups, markupAgg) * 100).toFixed(0)}%`}
        selector={
          <AggregationToggle value={markupAgg} onChange={setMarkupAgg} />
        }
      />
      <StatCard
        label="COGS"
        value={`${(aggregate(metrics.cogsValues, cogsAgg) * 100).toFixed(0)}%`}
        selector={<AggregationToggle value={cogsAgg} onChange={setCogsAgg} />}
      />
      <StatCard
        label="Dinero en inventario"
        value={formatCurrency(metrics.inventoryValue)}
      />
      <StatCard
        label="Precio promedio"
        value={formatCurrency(aggregate(metrics.prices, priceAgg))}
        selector={
          <AggregationToggle value={priceAgg} onChange={setPriceAgg} />
        }
      />
    </div>
  );
}
