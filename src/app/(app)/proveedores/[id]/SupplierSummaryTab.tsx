import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currency";
import { monthKeyOf, formatMonthLabel } from "@/lib/months";
import type { Supplier, SupplierBalance } from "@/lib/types";
import { type BreakdownRow } from "../../ventas/BreakdownCard";
import { VentasBreakdownCard } from "../../ventas/VentasBreakdownCard";
import Card from "@/components/ds/Card";
import SupplierNotes from "./SupplierNotes";

function StatCard({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <Card padding="sm" title={title}>
      <p className="text-xs font-semibold text-mh-ink-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-extrabold text-mh-ink">
        {value}
      </p>
    </Card>
  );
}

export default async function SupplierSummaryTab({
  supplier,
  balance,
  brandNames,
}: {
  supplier: Supplier;
  balance: SupplierBalance;
  brandNames: string[];
}) {
  const supabase = await createClient();

  const [{ data: purchaseEntries }, { count: productsCount }] = await Promise.all([
    supabase
      .from("supplier_ledger_entries")
      .select("entry_date, debit")
      .eq("supplier_id", supplier.id)
      .eq("kind", "compra"),
    supabase
      .from("supplier_products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", supplier.id),
  ]);

  const entries = purchaseEntries ?? [];
  const totalPurchased = entries.reduce((sum, e) => sum + e.debit, 0);

  const byMonth = new Map<string, number>();
  for (const e of entries) {
    const key = monthKeyOf(e.entry_date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + e.debit);
  }
  const monthlyAverage = byMonth.size > 0 ? totalPurchased / byMonth.size : 0;

  const chartRows: BreakdownRow[] = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, total]) => ({
      label: formatMonthLabel(monthKey),
      total_ars: total,
      total_usd: 0,
      line_count: total,
    }));

  return (
    <div className="font-inter space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total comprado" value={formatCurrency(totalPurchased)} />
        <StatCard
          label="Saldo pendiente"
          value={formatCurrency(balance.balance)}
        />
        <StatCard
          label="Cantidad de compras"
          value={String(balance.purchase_count)}
        />
        <StatCard
          label="Última compra"
          value={balance.last_purchase_date ?? "Sin compras"}
        />
        <StatCard
          label="Promedio mensual"
          value={formatCurrency(monthlyAverage)}
        />
        <StatCard
          label="Productos activos"
          value={String(productsCount ?? 0)}
        />
        <StatCard
          label="Marcas"
          value={String(brandNames.length)}
          title={brandNames.length > 0 ? brandNames.join(", ") : undefined}
        />
      </div>

      <VentasBreakdownCard
        title="Compras por mes"
        rows={chartRows}
        metric="facturacion"
        currency="ars"
        maxRows={12}
      />

      <SupplierNotes supplierId={supplier.id} initialNotes={supplier.internal_notes} />
    </div>
  );
}
