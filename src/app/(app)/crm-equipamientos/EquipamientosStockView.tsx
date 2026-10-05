import { DollarSign, Package } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/lib/types";
import EquipamientosStockTable from "./EquipamientosStockTable";

function StatCard({
  icon: Icon,
  iconClassName,
  valueClassName,
  label,
  value,
  sublabel,
}: {
  icon: typeof DollarSign;
  iconClassName: string;
  valueClassName: string;
  label: string;
  value: string;
  sublabel: string;
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

export default function EquipamientosStockView({
  rows,
  brandName,
  categoryName,
}: {
  rows: Product[];
  brandName: (id: string | null) => string;
  categoryName: (id: string | null) => string;
}) {
  // Stock valorizado: solo productos que tienen stock (stock > 0), cada
  // uno a su costo. Un producto en 0 no suma nada acá aunque tenga costo
  // cargado.
  const stockValorizado = rows
    .filter((p) => p.stock > 0)
    .reduce((sum, p) => sum + p.stock * p.cost, 0);
  const skuCount = rows.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          icon={DollarSign}
          iconClassName="text-violet-600"
          valueClassName="text-violet-600"
          label="Stock valorizado"
          value={formatCurrency(stockValorizado)}
          sublabel="Solo productos con stock, a costo"
        />
        <StatCard
          icon={Package}
          iconClassName="text-mh-blue"
          valueClassName="text-mh-blue"
          label="Cantidad de SKUs"
          value={String(skuCount)}
          sublabel="Productos de EQUIPAMIENTOS MH"
        />
      </div>

      <EquipamientosStockTable rows={rows} brandName={brandName} categoryName={categoryName} />
    </div>
  );
}
