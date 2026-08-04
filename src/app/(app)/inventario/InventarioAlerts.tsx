import Link from "next/link";
import { AlertOctagon, Bell, ChevronRight } from "lucide-react";
import Card from "@/components/ds/Card";
import IconTile from "@/components/ds/IconTile";

export default function InventarioAlerts({
  criticalCount,
  lowStockCount,
}: {
  criticalCount: number;
  lowStockCount: number;
}) {
  if (criticalCount === 0 && lowStockCount === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {criticalCount > 0 && (
        <Card className="font-inter flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconTile icon={AlertOctagon} tone="red" size={40} />
            <div>
              <p className="text-sm font-bold text-mh-ink">Stock crítico</p>
              <p className="text-sm text-mh-ink-muted">
                {criticalCount} producto(s) publicado(s) sin stock
              </p>
            </div>
          </div>
          <Link
            href="/inventario?stockMax=0&web=yes"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-mh-border px-3 py-2 text-sm font-semibold text-mh-ink hover:border-mh-pink hover:text-mh-pink"
          >
            Ver productos
            <ChevronRight size={15} />
          </Link>
        </Card>
      )}

      {lowStockCount > 0 && (
        <Card className="font-inter flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconTile icon={Bell} tone="amber" size={40} />
            <div>
              <p className="text-sm font-bold text-mh-ink">Stock bajo</p>
              <p className="text-sm text-mh-ink-muted">
                {lowStockCount} producto(s) con 0 o 1 unidad
              </p>
            </div>
          </div>
          <Link
            href="/inventario?stockMax=1"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-mh-border px-3 py-2 text-sm font-semibold text-mh-ink hover:border-mh-pink hover:text-mh-pink"
          >
            Reponer stock
            <ChevronRight size={15} />
          </Link>
        </Card>
      )}
    </div>
  );
}
