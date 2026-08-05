import Link from "next/link";
import { Plus, Users, CheckCircle2, Wallet, ShoppingBag, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Brand } from "@/lib/types";
import KpiCard from "@/components/ds/KpiCard";
import NotificationsBell from "@/components/ds/NotificationsBell";
import SupplierFilterBar from "./SupplierFilterBar";
import SuppliersTable, { type SupplierRow } from "./SuppliersTable";
import ProveedoresToolbar from "./ProveedoresToolbar";
import ProveedoresBottomDashboard, {
  type PendingBalanceRow,
  type MovementRow,
} from "./ProveedoresBottomDashboard";

// Componente puramente presentacional: page.tsx hace todo el fetching y
// los cálculos, este archivo solo arma la UI. Separado así para poder
// previsualizarlo con datos de prueba sin depender de Supabase (ver
// /preview-test) y para que page.tsx sea fácil de leer.
export default function ProveedoresView({
  rows,
  totalCount,
  activeCount,
  totalBalance,
  monthPurchasesTotal,
  staleCount,
  categories,
  brands,
  cities,
  topSuppliers,
  byCategory,
  pendingBalances,
  movements,
}: {
  rows: SupplierRow[];
  totalCount: number;
  activeCount: number;
  totalBalance: number;
  monthPurchasesTotal: number;
  staleCount: number;
  categories: string[];
  brands: Brand[];
  cities: string[];
  topSuppliers: { label: string; value: number }[];
  byCategory: { label: string; value: number }[];
  pendingBalances: PendingBalanceRow[];
  movements: MovementRow[];
}) {
  return (
    <div className="font-inter space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
            Proveedores
          </h1>
          <p className="mt-1 text-sm font-medium text-mh-ink-muted">
            {rows.length} proveedor(es)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <Link
            href="/proveedores/nuevo"
            className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
          >
            <Plus size={16} />
            Nuevo proveedor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={Users} tone="pink" label="Cantidad de proveedores" value={String(totalCount)} />
        <KpiCard icon={CheckCircle2} tone="blue" label="Activos" value={String(activeCount)} />
        <KpiCard
          icon={Wallet}
          tone={totalBalance > 0 ? "red" : "blue-light"}
          label="Saldo total pendiente"
          value={formatCurrency(totalBalance)}
        />
        <KpiCard
          icon={ShoppingBag}
          tone="blue-light"
          label="Compras del mes"
          value={formatCurrency(monthPurchasesTotal)}
        />
        <KpiCard
          icon={Clock}
          tone="amber"
          label="Sin compras hace +90 días"
          value={String(staleCount)}
        />
      </div>

      <ProveedoresToolbar rows={rows} />

      <SupplierFilterBar categories={categories} brands={brands} cities={cities} />

      <SuppliersTable rows={rows} />

      <ProveedoresBottomDashboard
        topSuppliers={topSuppliers}
        byCategory={byCategory}
        pendingBalances={pendingBalances}
        movements={movements}
      />
    </div>
  );
}
