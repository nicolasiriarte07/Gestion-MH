import { ShoppingBag, TrendingUp, Package, Target } from "lucide-react";
import KpiCard, { type KpiDelta } from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";

export default function InicioKpis({
  totalArs,
  totalArsDelta,
  salesCount,
  salesCountDelta,
  lowStockCount,
  marketingInvestment,
  periodLabel,
}: {
  totalArs: number;
  totalArsDelta: KpiDelta | undefined;
  salesCount: number;
  salesCountDelta: KpiDelta | undefined;
  lowStockCount: number;
  marketingInvestment: number;
  periodLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={ShoppingBag}
        tone="pink"
        label="Ventas totales"
        value={formatCurrency(totalArs)}
        delta={totalArsDelta}
      />
      <KpiCard
        icon={TrendingUp}
        tone="blue"
        label="Cantidad de ventas"
        value={String(salesCount)}
        delta={salesCountDelta}
      />
      <KpiCard
        icon={Package}
        tone="gray"
        label="Productos en stock bajo"
        value={String(lowStockCount)}
        sublabel="0 o 1 unidad en stock"
      />
      <KpiCard
        icon={Target}
        tone="blue-light"
        label="Inversión en marketing"
        value={formatCurrency(marketingInvestment)}
        sublabel={periodLabel}
      />
    </div>
  );
}
