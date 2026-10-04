"use client";

import { useMemo, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency, type Currency } from "@/lib/currency";
import type { SaleItem } from "@/lib/types";
import EquipamientosVentasTable from "./EquipamientosVentasTable";
import EquipamientosMonthlyChart from "./EquipamientosMonthlyChart";

const ALL_MONTHS = "todos";

function monthKeyOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  sublabel,
  valueClassName,
}: {
  icon: typeof DollarSign;
  iconClassName: string;
  label: string;
  value: string;
  sublabel: string;
  valueClassName: string;
}) {
  return (
    <Card className="font-inter">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-mh-ink-muted">{label}</p>
        <Icon size={18} className={iconClassName} />
      </div>
      <p className={`mt-3 text-2xl font-extrabold tracking-tight ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-mh-ink-muted">{sublabel}</p>
    </Card>
  );
}

export default function EquipamientosVentasView({ rows }: { rows: SaleItem[] }) {
  const months = useMemo(
    () => [...new Set(rows.map((r) => monthKeyOf(r.sale_date)))].sort().reverse(),
    [rows]
  );
  const [month, setMonth] = useState<string>(months[0] ?? ALL_MONTHS);
  const [currency, setCurrency] = useState<Currency>("ars");

  const filteredRows = useMemo(
    () => (month === ALL_MONTHS ? rows : rows.filter((r) => monthKeyOf(r.sale_date) === month)),
    [rows, month]
  );

  const total = filteredRows.reduce(
    (sum, r) => sum + (currency === "usd" ? (r.amount_usd ?? 0) : r.subtotal_with_iva),
    0
  );
  const count = filteredRows.length;
  const avgTicket = count > 0 ? total / count : 0;

  const periodLabel = month === ALL_MONTHS ? "todos los períodos" : monthLabel(month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        >
          <option value={ALL_MONTHS}>Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-mh-border bg-white p-1">
          {(["ars", "usd"] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                currency === c
                  ? "bg-mh-pink text-white"
                  : "text-mh-ink-muted hover:text-mh-ink"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          iconClassName="text-violet-600"
          valueClassName="text-violet-600"
          label="Facturación del Período"
          value={formatCurrency(total, currency)}
          sublabel={`Total de ${periodLabel}`}
        />
        <StatCard
          icon={ShoppingCart}
          iconClassName="text-mh-blue"
          valueClassName="text-mh-blue"
          label="Ventas del Período"
          value={String(count)}
          sublabel={`Transacciones en ${periodLabel}`}
        />
        <StatCard
          icon={TrendingUp}
          iconClassName="text-emerald-600"
          valueClassName="text-emerald-600"
          label="Ticket Promedio"
          value={formatCurrency(avgTicket, currency)}
          sublabel="Promedio por transacción"
        />
      </div>

      <EquipamientosMonthlyChart rows={rows} />

      <EquipamientosVentasTable rows={filteredRows} currency={currency} />
    </div>
  );
}
