import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { outstandingBalance } from "@/lib/equipamientoSales";
import type {
  Brand,
  Category,
  CrmInstallment,
  CrmInstallmentSale,
  EquipamientoContact,
  EquipamientoSale,
  Product,
  SaleItem,
} from "@/lib/types";
import CrmEquipamientosView from "./CrmEquipamientosView";
import type { ContactRow } from "./contactRow";

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

  // Pestaña "Cuenta corriente": ventas financiadas en cuotas propias de
  // este CRM (no vienen de sale_items ni de equipamientos_sales).
  const [{ data: installmentSales }, { data: installments }] = await Promise.all([
    fetchAllRows<CrmInstallmentSale>((from, to) =>
      supabase
        .from("crm_installment_sales")
        .select("*")
        .order("sale_date", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<CrmInstallment>((from, to) =>
      supabase
        .from("crm_installments")
        .select("*")
        .order("due_date", { ascending: true })
        .range(from, to)
    ),
  ]);

  // Última compra, facturación total, cantidad de ventas, saldo
  // pendiente y el detalle de compras por contacto — ahora por
  // contact_id real (ver migración 0050 y /ventas-equipamientos/vincular
  // para las ventas viejas que todavía no estén vinculadas).
  const salesByContactId: Record<string, EquipamientoSale[]> = {};
  for (const sale of sales ?? []) {
    if (!sale.contact_id) continue;
    const list = salesByContactId[sale.contact_id] ?? [];
    list.push(sale);
    salesByContactId[sale.contact_id] = list;
  }
  for (const list of Object.values(salesByContactId)) {
    list.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
  }

  const rows: ContactRow[] = (contacts ?? []).map((c) => {
    const matched = salesByContactId[c.id] ?? [];
    const lastPurchaseDate = matched.reduce<string | null>(
      (latest, s) => (s.fecha && (!latest || s.fecha > latest) ? s.fecha : latest),
      null
    );
    return {
      ...c,
      lastPurchaseDate,
      totalRevenue: matched.reduce((sum, s) => sum + s.monto, 0),
      salesCount: matched.length,
      outstandingBalance: matched.reduce((sum, s) => sum + outstandingBalance(s), 0),
    };
  });

  const cities = [
    ...new Set(rows.map((r) => r.city).filter((c): c is string => !!c)),
  ].sort();

  const categoryName = new Map(((categories ?? []) as Category[]).map((c) => [c.id, c.name]));
  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));

  return (
    <CrmEquipamientosView
      contactRows={rows}
      cities={cities}
      salesByContactId={salesByContactId}
      saleItems={equipamientosSaleItems ?? []}
      stockProducts={equipamientosProducts ?? []}
      categoryNameById={Object.fromEntries(categoryName)}
      brandNameById={Object.fromEntries(brandName)}
      installmentSales={installmentSales ?? []}
      installments={installments ?? []}
    />
  );
}
