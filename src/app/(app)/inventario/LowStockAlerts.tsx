import Link from "next/link";
import type { Product, Brand } from "@/lib/types";

export type LowStockRow = Product & { units_sold_90d: number };

export default function LowStockAlerts({ rows, brands }: { rows: LowStockRow[]; brands: Brand[] }) {
  if (rows.length === 0) return null;

  const brandName = new Map(brands.map((b) => [b.id, b.name]));

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
      <div className="border-b border-amber-200 px-4 py-3">
        <p className="text-sm font-semibold text-amber-900">
          ⚠ Alertas de stock bajo
        </p>
        <p className="text-xs text-amber-700">
          Productos con 5 unidades o menos, ordenados por los que más se
          vendieron en los últimos 90 días.
        </p>
      </div>
      <div className="divide-y divide-amber-100">
        {rows.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {p.description}{" "}
                <span className="font-normal text-slate-400">({p.sku})</span>
              </p>
              <p className="text-xs text-slate-500">
                {p.brand_id ? (brandName.get(p.brand_id) ?? "") : "Sin marca"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {p.units_sold_90d}
                </p>
                <p className="text-xs text-slate-500">vendidas (90d)</p>
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}
                >
                  {p.stock}
                </p>
                <p className="text-xs text-slate-500">en stock</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-amber-200 px-4 py-2">
        <Link
          href="/inventario?stockMax=5"
          className="text-xs font-medium text-amber-800 underline"
        >
          Ver todos en la tabla
        </Link>
      </div>
    </div>
  );
}
