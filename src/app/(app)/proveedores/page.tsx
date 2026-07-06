import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currency";
import type { Brand, Supplier, SupplierBalance } from "@/lib/types";
import SupplierFilterBar from "./SupplierFilterBar";
import SuppliersTable, { type SupplierRow } from "./SuppliersTable";

const INACTIVE_PURCHASE_DAYS = 90;

type SearchParams = {
  q?: string;
  cat?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, cat, brand, status, sort } = await searchParams;
  const supabase = await createClient();

  const firstOfMonth = `${todayISO().slice(0, 7)}-01`;

  const [
    { data: suppliers },
    { data: balances },
    { data: supplierBrands },
    { data: brands },
    { data: monthPurchases },
  ] = await Promise.all([
    supabase.from("suppliers").select("*").order("trade_name"),
    supabase.from("supplier_balances").select("*"),
    supabase.from("supplier_brands").select("supplier_id, brand_id"),
    supabase.from("brands").select("id, name").order("name"),
    supabase
      .from("supplier_ledger_entries")
      .select("debit")
      .eq("kind", "compra")
      .gte("entry_date", firstOfMonth)
      .lte("entry_date", todayISO()),
  ]);

  const allSuppliers = (suppliers ?? []) as Supplier[];
  const balanceBySupplier = new Map(
    ((balances ?? []) as SupplierBalance[]).map((b) => [b.supplier_id, b])
  );
  const brandName = new Map(
    ((brands ?? []) as Brand[]).map((b) => [b.id, b.name])
  );
  const brandsBySupplier = new Map<string, string[]>();
  const brandIdsBySupplier = new Map<string, Set<string>>();
  for (const sb of supplierBrands ?? []) {
    const names = brandsBySupplier.get(sb.supplier_id) ?? [];
    const name = brandName.get(sb.brand_id);
    if (name) names.push(name);
    brandsBySupplier.set(sb.supplier_id, names);

    const ids = brandIdsBySupplier.get(sb.supplier_id) ?? new Set<string>();
    ids.add(sb.brand_id);
    brandIdsBySupplier.set(sb.supplier_id, ids);
  }

  const categories = [
    ...new Set(allSuppliers.map((s) => s.category).filter((c): c is string => !!c)),
  ].sort();

  let rows: SupplierRow[] = allSuppliers.map((s) => ({
    ...s,
    balance: balanceBySupplier.get(s.id)?.balance ?? 0,
    last_purchase_date: balanceBySupplier.get(s.id)?.last_purchase_date ?? null,
    brandNames: brandsBySupplier.get(s.id) ?? [],
  }));

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.trade_name.toLowerCase().includes(needle) ||
        (r.legal_name ?? "").toLowerCase().includes(needle) ||
        (r.cuit ?? "").toLowerCase().includes(needle)
    );
  }
  if (cat) rows = rows.filter((r) => r.category === cat);
  if (brand) rows = rows.filter((r) => brandIdsBySupplier.get(r.id)?.has(brand));
  if (status === "active") rows = rows.filter((r) => r.is_active);
  if (status === "inactive") rows = rows.filter((r) => !r.is_active);

  if (sort === "deuda") {
    rows = [...rows].sort((a, b) => b.balance - a.balance);
  } else if (sort === "ultima_compra") {
    rows = [...rows].sort((a, b) =>
      (b.last_purchase_date ?? "").localeCompare(a.last_purchase_date ?? "")
    );
  } else {
    rows = [...rows].sort((a, b) => a.trade_name.localeCompare(b.trade_name));
  }

  // KPIs del módulo: se calculan sobre TODOS los proveedores, no sobre el
  // resultado filtrado (es un panorama general, igual que el Resumen).
  const totalCount = allSuppliers.length;
  const activeCount = allSuppliers.filter((s) => s.is_active).length;
  const totalBalance = [...balanceBySupplier.values()].reduce(
    (sum, b) => sum + b.balance,
    0
  );
  const monthPurchasesTotal = (monthPurchases ?? []).reduce(
    (sum, r) => sum + r.debit,
    0
  );
  const staleThreshold = daysAgoISO(INACTIVE_PURCHASE_DAYS);
  const staleCount = allSuppliers.filter((s) => {
    if (!s.is_active) return false;
    const lastPurchase = balanceBySupplier.get(s.id)?.last_purchase_date;
    return !lastPurchase || lastPurchase < staleThreshold;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500">
            {rows.length} proveedor(es)
          </p>
        </div>
        <Link
          href="/proveedores/nuevo"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Nuevo proveedor
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Cantidad de proveedores" value={String(totalCount)} />
        <StatCard label="Activos" value={String(activeCount)} />
        <StatCard
          label="Saldo total pendiente"
          value={formatCurrency(totalBalance)}
        />
        <StatCard
          label="Compras del mes"
          value={formatCurrency(monthPurchasesTotal)}
        />
        <StatCard
          label="Sin compras hace +90 días"
          value={String(staleCount)}
        />
      </div>

      <SupplierFilterBar categories={categories} brands={(brands ?? []) as Brand[]} />

      <SuppliersTable rows={rows} />
    </div>
  );
}
