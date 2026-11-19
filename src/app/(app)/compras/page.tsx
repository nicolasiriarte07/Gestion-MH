import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { Brand, BusinessUnit, Product, PurchaseOrder, PurchaseOrderItem } from "@/lib/types";
import ComprasView from "./ComprasView";

// Solo las 2 unidades de negocio que el usuario maneja en Compras (no
// Ecommerce, que no tiene local/depósito propio donde recibir pedidos).
const RELEVANT_UNIT_NAMES = ["mundo hogar", "equipamientos mh"];

export default async function ComprasPage() {
  const supabase = await createClient();

  const [
    { data: businessUnits },
    { data: brands },
    { data: products },
    { data: orders },
    { data: items },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name"),
    supabase.from("brands").select("id, name").order("name"),
    fetchAllRows<Product>((from, to) =>
      supabase.from("products").select("*").order("description").range(from, to)
    ),
    fetchAllRows<PurchaseOrder>((from, to) =>
      supabase
        .from("purchase_orders")
        .select("*")
        .order("order_date", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<PurchaseOrderItem>((from, to) =>
      supabase.from("purchase_order_items").select("*").range(from, to)
    ),
  ]);

  const relevantUnits = ((businessUnits ?? []) as BusinessUnit[])
    .filter((bu) => RELEVANT_UNIT_NAMES.includes(bu.name.trim().toLowerCase()))
    // "Mundo Hogar" antes que "Equipamientos MH", sin depender del orden
    // en que haya quedado insertado en la tabla.
    .sort(
      (a, b) =>
        RELEVANT_UNIT_NAMES.indexOf(a.name.trim().toLowerCase()) -
        RELEVANT_UNIT_NAMES.indexOf(b.name.trim().toLowerCase())
    );

  return (
    <ComprasView
      businessUnits={relevantUnits}
      brands={(brands ?? []) as Brand[]}
      products={(products ?? []) as Product[]}
      initialOrders={orders ?? []}
      initialItems={items ?? []}
    />
  );
}
