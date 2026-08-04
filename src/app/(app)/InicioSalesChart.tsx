"use client";

import { useState } from "react";
import Card from "@/components/ds/Card";
import AreaLineChart from "@/components/ds/AreaLineChart";
import { formatCurrency } from "@/lib/currency";

type Metric = "facturacion" | "ventas";

export type DailySalesRow = {
  date: string;
  total_ars: number;
  line_count: number;
};

export default function InicioSalesChart({
  rows,
  totalArs,
  avgTicket,
  unitCount,
  uniqueCustomers,
}: {
  rows: DailySalesRow[];
  totalArs: number;
  avgTicket: number;
  unitCount: number;
  uniqueCustomers: number;
}) {
  const [metric, setMetric] = useState<Metric>("facturacion");

  const chartRows = rows.map((r) => ({
    date: r.date,
    value: metric === "facturacion" ? r.total_ars : r.line_count,
  }));

  return (
    <Card className="font-inter">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-mh-ink">
          Ventas de los últimos 30 días
        </p>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="rounded-lg border border-mh-border bg-white px-3 py-1.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        >
          <option value="facturacion">Facturación</option>
          <option value="ventas">Ventas</option>
        </select>
      </div>

      <div className="mt-6">
        <AreaLineChart rows={chartRows} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-mh-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-mh-ink">
            {formatCurrency(totalArs)}
          </p>
          <p className="text-xs font-medium text-mh-ink-muted">Total vendido</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-mh-ink">
            {formatCurrency(avgTicket)}
          </p>
          <p className="text-xs font-medium text-mh-ink-muted">Ticket promedio</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-mh-ink">{unitCount}</p>
          <p className="text-xs font-medium text-mh-ink-muted">Unidades vendidas</p>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-mh-ink">{uniqueCustomers}</p>
          <p className="text-xs font-medium text-mh-ink-muted">Clientes únicos</p>
        </div>
      </div>
    </Card>
  );
}
