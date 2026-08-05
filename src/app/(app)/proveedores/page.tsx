import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { Brand, Supplier, SupplierBalance, SupplierHistoryEntry } from "@/lib/types";
import type { SupplierRow } from "./SuppliersTable";
import ProveedoresView from "./ProveedoresView";

const INACTIVE_PURCHASE_DAYS = 90;
const MOVEMENTS_LIMIT = 12;

type SearchParams = {
  q?: string;
  cat?: string;
  brand?: string;
  city?: string;
  status?: string;
  sort?: string;
};

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
  const { q, cat, brand, city, status, sort } = await searchParams;
  const supabase = await createClient();

  const firstOfMonth = `${todayISO().slice(0, 7)}-01`;

  const [
    { data: suppliers },
    { data: balances },
    { data: supplierBrands },
    { data: brands },
    { data: monthPurchases },
    { data: allPurchases },
    { data: history },
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
    fetchAllRows<{ supplier_id: string; debit: number }>((from, to) =>
      supabase
        .from("supplier_ledger_entries")
        .select("supplier_id, debit")
        .eq("kind", "compra")
        .range(from, to)
    ),
    supabase
      .from("supplier_history")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(MOVEMENTS_LIMIT),
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

  // Total histórico comprado por proveedor: base de la columna "Compras
  // acum." de la tabla y de los dos gráficos del dashboard inferior
  // (top proveedores / por categoría).
  const purchasedBySupplier = new Map<string, number>();
  for (const entry of allPurchases ?? []) {
    purchasedBySupplier.set(
      entry.supplier_id,
      (purchasedBySupplier.get(entry.supplier_id) ?? 0) + entry.debit
    );
  }

  const categories = [
    ...new Set(allSuppliers.map((s) => s.category).filter((c): c is string => !!c)),
  ].sort();
  const cities = [
    ...new Set(allSuppliers.map((s) => s.city).filter((c): c is string => !!c)),
  ].sort();

  let rows: SupplierRow[] = allSuppliers.map((s) => ({
    ...s,
    balance: balanceBySupplier.get(s.id)?.balance ?? 0,
    last_purchase_date: balanceBySupplier.get(s.id)?.last_purchase_date ?? null,
    brandNames: brandsBySupplier.get(s.id) ?? [],
    totalPurchased: purchasedBySupplier.get(s.id) ?? 0,
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
  if (city) rows = rows.filter((r) => r.city === city);
  if (status === "active") rows = rows.filter((r) => r.is_active);
  if (status === "inactive") rows = rows.filter((r) => !r.is_active);
  if (status === "con_deuda") rows = rows.filter((r) => r.balance > 0);
  if (status === "al_dia") rows = rows.filter((r) => r.balance <= 0);

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

  // Dashboard inferior.
  const topSuppliers = [...purchasedBySupplier.entries()]
    .map(([id, total]) => ({
      label: allSuppliers.find((s) => s.id === id)?.trade_name ?? "—",
      value: total,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const purchasedByCategory = new Map<string, number>();
  for (const [supplierId, total] of purchasedBySupplier.entries()) {
    const cat = allSuppliers.find((s) => s.id === supplierId)?.category ?? "Sin categoría";
    purchasedByCategory.set(cat, (purchasedByCategory.get(cat) ?? 0) + total);
  }
  const byCategory = [...purchasedByCategory.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const pendingBalances = allSuppliers
    .map((s) => ({
      id: s.id,
      trade_name: s.trade_name,
      balance: balanceBySupplier.get(s.id)?.balance ?? 0,
      last_purchase_date: balanceBySupplier.get(s.id)?.last_purchase_date ?? null,
    }))
    .filter((s) => s.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 8);

  const supplierNameById = new Map(allSuppliers.map((s) => [s.id, s.trade_name]));
  const movements = ((history ?? []) as SupplierHistoryEntry[]).map((h) => ({
    id: h.id,
    supplierName: supplierNameById.get(h.supplier_id) ?? "—",
    description: h.description,
    occurred_at: h.occurred_at,
  }));

  return (
    <ProveedoresView
      rows={rows}
      totalCount={totalCount}
      activeCount={activeCount}
      totalBalance={totalBalance}
      monthPurchasesTotal={monthPurchasesTotal}
      staleCount={staleCount}
      categories={categories}
      brands={(brands ?? []) as Brand[]}
      cities={cities}
      topSuppliers={topSuppliers}
      byCategory={byCategory}
      pendingBalances={pendingBalances}
      movements={movements}
    />
  );
}
