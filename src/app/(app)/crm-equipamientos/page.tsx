import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { EquipamientoContact } from "@/lib/types";
import ContactsView from "./ContactsView";
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

  const [{ data: contacts }, { data: sales }] = await Promise.all([
    fetchAllRows<EquipamientoContact>((from, to) =>
      supabase
        .from("equipamientos_contacts")
        .select("*")
        .order("city", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{ cliente: string; fecha: string | null; monto: number }>((from, to) =>
      supabase.from("equipamientos_sales").select("cliente, fecha, monto").range(from, to)
    ),
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

  return (
    <ContactsView
      rows={rows}
      totalCount={totalCount}
      contactedThisWeek={contactedThisWeek}
      staleCount={staleCount}
    />
  );
}
