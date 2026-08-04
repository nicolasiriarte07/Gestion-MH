import Link from "next/link";
import {
  ShoppingCart,
  UserPlus,
  PackagePlus,
  Boxes,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import Card from "@/components/ds/Card";
import Donut, { type DonutRow } from "@/components/ds/Donut";
import MiniBarChart, { type BarRow } from "@/components/ds/MiniBarChart";
import { formatCurrency } from "@/lib/currency";

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/ventas/import", label: "Nueva venta", icon: ShoppingCart },
  { href: "/clientes", label: "Nuevo cliente", icon: UserPlus },
  { href: "/inventario/import", label: "Ingresar stock", icon: PackagePlus },
  { href: "/inventario", label: "Ver inventario", icon: Boxes },
  { href: "/ventas", label: "Ver reportes", icon: BarChart3 },
];

export default function InicioBreakdownRow({
  byReceiptLetter,
  byWeekday,
  byBusinessUnit,
}: {
  byReceiptLetter: DonutRow[];
  byWeekday: BarRow[];
  byBusinessUnit: DonutRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 font-inter lg:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">
          Ventas por tipo de comprobante
        </p>
        <Donut rows={byReceiptLetter} formatValue={formatCurrency} />
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">
          Ventas por día de la semana
        </p>
        <MiniBarChart rows={byWeekday} />
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">
          Ventas por unidad de negocio
        </p>
        <Donut rows={byBusinessUnit} formatValue={formatCurrency} />
      </Card>

      <Card>
        <p className="mb-5 text-sm font-bold text-mh-ink">Acciones rápidas</p>
        <div className="space-y-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-mh-border px-3 py-2.5 text-sm font-semibold text-mh-ink hover:border-mh-pink hover:bg-mh-pink-light hover:text-mh-pink"
              >
                <Icon size={17} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
