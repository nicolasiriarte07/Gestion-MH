import { Boxes, Wallet, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";

// Estas 5 tarjetas son una foto del momento (sin flecha de comparación
// contra el mes anterior, a diferencia de las de Inicio): el inventario
// no tiene una tabla de historial/snapshots todavía, así que no hay con
// qué compararlas de forma real. Se agrega cuando haga falta.
export default function InventarioKpis({
  productCount,
  inventoryValue,
  lowStockCount,
  outOfStockCount,
  avgMarkup,
}: {
  productCount: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  avgMarkup: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        icon={Boxes}
        tone="pink"
        label="Cantidad de productos"
        value={String(productCount)}
      />
      <KpiCard
        icon={Wallet}
        tone="blue"
        label="Valor total del inventario"
        value={formatCurrency(inventoryValue)}
      />
      <KpiCard
        icon={AlertTriangle}
        tone="amber"
        label="Productos con stock bajo"
        value={String(lowStockCount)}
      />
      <KpiCard
        icon={XCircle}
        tone="red"
        label="Productos sin stock"
        value={String(outOfStockCount)}
      />
      <KpiCard
        icon={TrendingUp}
        tone="blue-light"
        label="Markup promedio"
        value={`${avgMarkup.toFixed(0)}%`}
      />
    </div>
  );
}
