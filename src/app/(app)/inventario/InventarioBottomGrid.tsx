import { Clock } from "lucide-react";
import Card from "@/components/ds/Card";
import BarList, { type BarListRow } from "@/components/ds/BarList";
import { formatCurrency } from "@/lib/currency";

export type ImmobilizedRow = {
  description: string;
  stock: number;
  value: number;
};

export default function InventarioBottomGrid({
  stockByCategory,
  stockByBrand,
  topImmobilized,
}: {
  stockByCategory: BarListRow[];
  stockByBrand: BarListRow[];
  topImmobilized: ImmobilizedRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 font-inter lg:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">Stock por categoría</p>
        <BarList rows={stockByCategory.slice(0, 8)} formatValue={(v) => String(v)} />
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">Marcas con mayor inventario</p>
        <BarList rows={stockByBrand.slice(0, 8)} formatValue={formatCurrency} />
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">
          Productos con mayor valor inmovilizado
        </p>
        {topImmobilized.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">Sin datos todavía.</p>
        ) : (
          <div className="space-y-3">
            {topImmobilized.slice(0, 8).map((p) => (
              <div key={p.description} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-mh-ink">{p.description}</p>
                  <p className="text-xs text-mh-ink-muted">{p.stock} en stock</p>
                </div>
                <span className="shrink-0 font-bold text-mh-ink">{formatCurrency(p.value)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">Últimos movimientos</p>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Clock size={24} className="text-slate-300" />
          <p className="max-w-[24ch] text-sm text-mh-ink-muted">
            Todavía no se registran entradas, salidas ni ajustes de stock.
          </p>
        </div>
      </Card>
    </div>
  );
}
