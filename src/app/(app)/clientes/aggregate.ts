import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { createClient } from "@/lib/supabase/server";

// Reconstruye la "lista de clientes" agregando sale_items por nombre. No
// existe una tabla customers en la base: un cliente es simplemente un
// nombre que aparece en las ventas. Mismo criterio de exclusión que las
// métricas generales del módulo (migración 0034): "Consumidor Final" no
// es un cliente real, es el genérico para ventas sin identificar.
const EXCLUDED_NAME = "consumidor final";

export type ClienteRow = {
  customer_name: string;
  total_ars: number;
  total_usd: number;
  line_count: number;
  visit_count: number;
  first_sale_date: string;
  last_sale_date: string;
};

export async function fetchClientesAggregate(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ClienteRow[]> {
  const { data } = await fetchAllRows<{
    customer_name: string | null;
    subtotal_with_iva: number;
    amount_usd: number | null;
    sale_date: string;
  }>((from, to) =>
    supabase
      .from("sale_items")
      .select("customer_name, subtotal_with_iva, amount_usd, sale_date")
      .range(from, to)
  );

  const byCustomer = new Map<
    string,
    { total_ars: number; total_usd: number; line_count: number; dates: Set<string> }
  >();

  for (const row of data) {
    const name = row.customer_name?.trim();
    if (!name || name.toLowerCase() === EXCLUDED_NAME) continue;

    const entry = byCustomer.get(name) ?? {
      total_ars: 0,
      total_usd: 0,
      line_count: 0,
      dates: new Set<string>(),
    };
    entry.total_ars += row.subtotal_with_iva;
    entry.total_usd += row.amount_usd ?? 0;
    entry.line_count += 1;
    entry.dates.add(row.sale_date);
    byCustomer.set(name, entry);
  }

  return [...byCustomer.entries()].map(([customer_name, v]) => {
    const sortedDates = [...v.dates].sort();
    return {
      customer_name,
      total_ars: v.total_ars,
      total_usd: v.total_usd,
      line_count: v.line_count,
      visit_count: v.dates.size,
      first_sale_date: sortedDates[0],
      last_sale_date: sortedDates[sortedDates.length - 1],
    };
  });
}

export type ClienteStatus = "vip" | "inactivo" | "nuevo" | "frecuente" | "activo";

// Umbrales de segmentación (no vienen de ningún lado, son una definición
// razonable para poder mostrar los 5 estados que pide el diseño):
// - Inactivo: sin comprar hace más de 90 días (mismo umbral que
//   "Proveedores sin compras" en el módulo Proveedores).
// - Nuevo: primera compra hace 30 días o menos.
// - VIP: 10% de clientes con mayor facturación histórica.
// - Frecuente: 3 o más visitas distintas.
// - Activo: no encuadra en ninguno de los anteriores.
// Precedencia: Inactivo (por recencia) primero, después VIP, Nuevo,
// Frecuente y por último Activo como default.
const INACTIVE_DAYS = 90;
const NEW_DAYS = 30;
const FREQUENT_MIN_VISITS = 3;
const VIP_TOP_SHARE = 0.1;

function daysAgoISO(days: number, today: Date): string {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function classifyClientes(
  rows: ClienteRow[],
  today: Date = new Date()
): (ClienteRow & { status: ClienteStatus })[] {
  const inactiveThreshold = daysAgoISO(INACTIVE_DAYS, today);
  const newThreshold = daysAgoISO(NEW_DAYS, today);

  const vipCount = Math.max(1, Math.ceil(rows.length * VIP_TOP_SHARE));
  const vipNames = new Set(
    [...rows]
      .sort((a, b) => b.total_ars - a.total_ars)
      .slice(0, vipCount)
      .map((r) => r.customer_name)
  );

  return rows.map((r) => {
    let status: ClienteStatus;
    if (r.last_sale_date < inactiveThreshold) status = "inactivo";
    else if (vipNames.has(r.customer_name)) status = "vip";
    else if (r.first_sale_date >= newThreshold) status = "nuevo";
    else if (r.visit_count >= FREQUENT_MIN_VISITS) status = "frecuente";
    else status = "activo";
    return { ...r, status };
  });
}
