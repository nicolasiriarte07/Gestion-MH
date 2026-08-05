"use server";

import { createClient } from "@/lib/supabase/server";
import type { HistoryRow } from "./CustomerHistoryView";

export type ClienteQuickProduct = {
  description: string;
  quantity: number;
  total_ars: number;
};

export type ClienteQuickView = {
  recentSales: HistoryRow[];
  topProducts: ClienteQuickProduct[];
};

// Datos "a demanda" para la vista rápida del Drawer: reusa la misma RPC
// customer_sales_history del buscador (nombre exacto, ya recortado), sin
// pedirla para todos los clientes de la lista de una.
export async function getClienteQuickView(customerName: string): Promise<ClienteQuickView> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_sales_history", {
    customer_name_exact: customerName,
  });
  const rows = (data ?? []) as HistoryRow[];

  const byProduct = new Map<string, { quantity: number; total_ars: number }>();
  for (const r of rows) {
    const entry = byProduct.get(r.product_description_raw) ?? { quantity: 0, total_ars: 0 };
    entry.quantity += r.quantity;
    entry.total_ars += r.subtotal_with_iva;
    byProduct.set(r.product_description_raw, entry);
  }
  const topProducts = [...byProduct.entries()]
    .map(([description, v]) => ({ description, quantity: v.quantity, total_ars: v.total_ars }))
    .sort((a, b) => b.total_ars - a.total_ars)
    .slice(0, 5);

  return {
    recentSales: rows.slice(0, 5),
    topProducts,
  };
}
