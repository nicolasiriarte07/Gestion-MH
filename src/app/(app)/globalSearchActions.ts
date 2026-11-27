"use server";

import { createClient } from "@/lib/supabase/server";

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Productos" | "Contactos" | "Ventas" | "Pedidos";
};

const RESULT_LIMIT = 5;

// Búsqueda liviana por ilike en las tablas principales (sin tocar nada
// de lo existente, es de solo lectura). Pensada para el buscador
// Cmd/Ctrl+K: unos pocos resultados por categoría, no un buscador
// exhaustivo.
export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${needle}%`;

  const [products, contacts, sales, equipSales] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, description")
      .or(`sku.ilike.${pattern},description.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("equipamientos_contacts")
      .select("id, name, business_name, phone")
      .or(`name.ilike.${pattern},business_name.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("sale_items")
      .select("id, customer_name, product_description_raw")
      .ilike("customer_name", pattern)
      .limit(RESULT_LIMIT),
    supabase
      .from("equipamientos_sales")
      .select("id, cliente, comercio, producto")
      .or(`cliente.ilike.${pattern},comercio.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
  ]);

  const results: GlobalSearchResult[] = [];

  for (const p of products.data ?? []) {
    results.push({
      id: p.id,
      title: p.description,
      subtitle: p.sku,
      href: "/inventario",
      group: "Productos",
    });
  }

  for (const c of contacts.data ?? []) {
    results.push({
      id: c.id,
      title: c.name?.trim() && c.name !== "-" ? c.name : (c.business_name ?? "Contacto"),
      subtitle: c.phone ?? "",
      href: "/crm-equipamientos",
      group: "Contactos",
    });
  }

  for (const s of sales.data ?? []) {
    results.push({
      id: s.id,
      title: s.customer_name ?? "Venta",
      subtitle: s.product_description_raw,
      href: "/ventas",
      group: "Ventas",
    });
  }

  for (const es of equipSales.data ?? []) {
    results.push({
      id: es.id,
      title: es.cliente ?? es.comercio ?? "Venta",
      subtitle: es.producto,
      href: "/ventas-equipamientos",
      group: "Ventas",
    });
  }

  return results;
}
