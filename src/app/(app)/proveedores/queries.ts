"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupplierLedgerEntry } from "@/lib/types";

export type SupplierQuickProduct = {
  id: string;
  sku: string;
  description: string;
  last_purchase_date: string | null;
};

export type SupplierQuickView = {
  recentPurchases: SupplierLedgerEntry[];
  recentPayments: SupplierLedgerEntry[];
  topProducts: SupplierQuickProduct[];
};

// Datos "a demanda" para la vista rápida del Drawer: no se precargan para
// todos los proveedores de la lista (sería carísimo con muchos
// proveedores), se piden recién cuando se abre uno. Mismas tablas y
// filtros que ya usan las pestañas Cuenta Corriente/Pagos/Productos de la
// ficha completa, solo que acá se limita a los últimos 5 de cada uno.
export async function getSupplierQuickView(supplierId: string): Promise<SupplierQuickView> {
  const supabase = await createClient();

  const [{ data: purchases }, { data: payments }, { data: products }] = await Promise.all([
    supabase
      .from("supplier_ledger_entries")
      .select("*")
      .eq("supplier_id", supplierId)
      .eq("kind", "compra")
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("supplier_ledger_entries")
      .select("*")
      .eq("supplier_id", supplierId)
      .eq("kind", "pago")
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("supplier_products")
      .select("id, last_purchase_date, products(sku, description)")
      .eq("supplier_id", supplierId)
      .order("last_purchase_date", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  return {
    recentPurchases: (purchases ?? []) as SupplierLedgerEntry[],
    recentPayments: (payments ?? []) as SupplierLedgerEntry[],
    topProducts: (products ?? []).map((p) => {
      const product = p.products as unknown as { sku: string; description: string } | null;
      return {
        id: p.id,
        sku: product?.sku ?? "—",
        description: product?.description ?? "Producto eliminado",
        last_purchase_date: p.last_purchase_date,
      };
    }),
  };
}
