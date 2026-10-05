import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type {
  Brand,
  Category,
  EquipamientoContact,
  EquipamientoSale,
  Product,
  SaleItem,
} from "@/lib/types";
import CrmEquipamientosView from "./CrmEquipamientosView";
import type { ContactRow } from "./ContactsTable";

const RECENT_CONTACT_DAYS = 7;
const STALE_CONTACT_DAYS = 30;

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export default async function CrmEquipamientosPage() {
  const supabase = await createClient();

  const [{ data: contacts }, { data: sales }, { data: businessUnits }] = await Promise.all([
    fetchAllRows<EquipamientoContact>((from, to) =>
      supabase
        .from("equipamientos_contacts")
        .select("*")
        .order("city", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<EquipamientoSale>((from, to) =>
      supabase
        .from("equipamientos_sales")
        .select("*")
        .order("fecha", { ascending: false })
        .range(from, to)
    ),
    supabase.from("business_units").select("id, name"),
  ]);

  // La pestaña "Ventas" del CRM muestra las ventas reales importadas en el
  // módulo Ventas general (sale_items), filtradas a la unidad de negocio
  // EQUIPAMIENTOS MH — no la tabla equipamientos_sales (esa sigue siendo
  // la fuente de Última compra/Facturación total/Cantidad de ventas de la
  // pestaña Contactos, y del módulo Ventas Equipamientos aparte).
  const equipamientosMhId =
    (businessUnits ?? []).find(
      (bu) => bu.name.trim().toLowerCase() === "equipamientos mh"
    )?.id ?? null;

  const { data: equipamientosSaleItems } = equipamientosMhId
    ? await fetchAllRows<SaleItem>((from, to) =>
        supabase
          .from("sale_items")
          .select("*")
          .eq("business_unit_id", equipamientosMhId)
          .order("sale_date", { ascending: false })
          .range(from, to)
      )
    : { data: [] as SaleItem[] };

  // Pestaña "Stock": productos de Inventario de la unidad de negocio
  // EQUIPAMIENTOS MH únicamente.
  const [{ data: equipamientosProducts }, { data: categories }, { data: brands }] =
    await Promise.all([
      equipamientosMhId
        ? fetchAllRows<Product>((from, to) =>
            supabase
              .from("products")
              .select("*")
              .eq("business_unit_id", equipamientosMhId)
              .order("stock", { ascending: false })
              .order("description", { ascending: true })
              .range(from, to)
          )
        : Promise.resolve({ data: [] as Product[], error: null }),
      supabase.from("categories").select("id, name"),
      supabase.from("brands").select("id, name"),
    ]);

  // Última compra, facturación total y cantidad de ventas por cliente,
  // agregado en una sola pasada. Se matchea por nombre normalizado porque
  // "Cliente" en Ventas y "Nombre" en el CRM son campos de texto libre
  // cargados a mano, no hay un ID en común. Las fechas ISO "YYYY-MM-DD"
  // comparan bien como texto.
  const salesByName = new Map<
    string,
    { lastPurchaseDate: string | null; totalRevenue: number; salesCount: number }
  >();
  for (const sale of sales ?? []) {
    const key = normalizeName(sale.cliente);
    const agg = salesByName.get(key) ?? {
      lastPurchaseDate: null,
      totalRevenue: 0,
      salesCount: 0,
    };
    agg.totalRevenue += sale.monto;
    agg.salesCount += 1;
    if (sale.fecha && (!agg.lastPurchaseDate || sale.fecha > agg.lastPurchaseDate)) {
      agg.lastPurchaseDate = sale.fecha;
    }
    salesByName.set(key, agg);
  }

  const rows: ContactRow[] = (contacts ?? []).map((c) => {
    const agg = salesByName.get(normalizeName(c.name));
    return {
      ...c,
      lastPurchaseDate: agg?.lastPurchaseDate ?? null,
      totalRevenue: agg?.totalRevenue ?? 0,
      salesCount: agg?.salesCount ?? 0,
    };
  });

  const recentThreshold = daysAgoISO(RECENT_CONTACT_DAYS);
  const staleThreshold = daysAgoISO(STALE_CONTACT_DAYS);

  const totalCount = rows.length;
  const contactedThisWeek = rows.filter(
    (c) => c.last_contact_date && c.last_contact_date >= recentThreshold
  ).length;
  const staleCount = rows.filter(
    (c) => !c.last_contact_date || c.last_contact_date < staleThreshold
  ).length;

  const categoryName = new Map(((categories ?? []) as Category[]).map((c) => [c.id, c.name]));
  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));

  return (
    <CrmEquipamientosView
      contactRows={rows}
      totalCount={totalCount}
      contactedThisWeek={contactedThisWeek}
      staleCount={staleCount}
      saleItems={equipamientosSaleItems ?? []}
      stockProducts={equipamientosProducts ?? []}
      categoryNameById={Object.fromEntries(categoryName)}
      brandNameById={Object.fromEntries(brandName)}
    />
  );
}
