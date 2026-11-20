import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type {
  Brand,
  Category,
  ContactStage,
  CrmInstallment,
  CrmInstallmentSale,
  EquipamientoContact,
  EquipamientoSale,
  Product,
  SaleItem,
} from "@/lib/types";
import { CONTACT_STAGES } from "@/lib/types";
import CrmEquipamientosView from "./CrmEquipamientosView";
import type { ContactRow } from "./ContactsTable";
import { needsFollowUpToday, todayISO } from "./followUp";

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

// Une las ventas de equipamientos_sales a un contacto por nombre de
// cliente O de comercio (cualquiera de los dos campos de la venta puede
// coincidir con el nombre o el comercio del contacto) — antes solo se
// matcheaba cliente-vs-nombre, esto suma los casos donde el vendedor
// cargó el nombre del comercio en cualquiera de las dos columnas.
function buildSalesByNormalizedKey(sales: EquipamientoSale[]): Map<string, EquipamientoSale[]> {
  const map = new Map<string, EquipamientoSale[]>();
  function add(key: string | null, sale: EquipamientoSale) {
    if (!key) return;
    const list = map.get(key) ?? [];
    list.push(sale);
    map.set(key, list);
  }
  for (const sale of sales) {
    add(normalizeName(sale.cliente), sale);
    add(sale.comercio ? normalizeName(sale.comercio) : null, sale);
  }
  return map;
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

  // Última compra, facturación total, cantidad de ventas y el detalle de
  // compras por contacto, agregado en una sola pasada a partir del mismo
  // índice cliente/comercio. Las fechas ISO "YYYY-MM-DD" comparan bien
  // como texto.
  const salesByKey = buildSalesByNormalizedKey(sales ?? []);
  const salesByContactId: Record<string, EquipamientoSale[]> = {};

  function matchedSalesFor(contact: EquipamientoContact): EquipamientoSale[] {
    const keys = [normalizeName(contact.name)];
    if (contact.business_name) keys.push(normalizeName(contact.business_name));
    const matched = new Map<string, EquipamientoSale>();
    for (const key of keys) {
      for (const sale of salesByKey.get(key) ?? []) matched.set(sale.id, sale);
    }
    return [...matched.values()].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
  }

  const rows: ContactRow[] = (contacts ?? []).map((c) => {
    const matched = matchedSalesFor(c);
    salesByContactId[c.id] = matched;
    const lastPurchaseDate = matched.reduce<string | null>(
      (latest, s) => (s.fecha && (!latest || s.fecha > latest) ? s.fecha : latest),
      null
    );
    return {
      ...c,
      lastPurchaseDate,
      totalRevenue: matched.reduce((sum, s) => sum + s.monto, 0),
      salesCount: matched.length,
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

  const stageCounts = CONTACT_STAGES.reduce(
    (acc, stage) => ({ ...acc, [stage]: 0 }),
    {} as Record<ContactStage, number>
  );
  for (const c of rows) stageCounts[c.etapa]++;

  const today = todayISO();
  const dueTodayCount = rows.filter((c) => needsFollowUpToday(c, today)).length;

  const categoryName = new Map(((categories ?? []) as Category[]).map((c) => [c.id, c.name]));
  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));

  return (
    <CrmEquipamientosView
      contactRows={rows}
      totalCount={totalCount}
      contactedThisWeek={contactedThisWeek}
      staleCount={staleCount}
      stageCounts={stageCounts}
      dueTodayCount={dueTodayCount}
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
