import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { EquipamientoContact, EquipamientoSale } from "@/lib/types";
import VincularVentasView from "./VincularVentasView";

export default async function VincularVentasPage() {
  const supabase = await createClient();

  const [{ data: sales }, { data: contacts }] = await Promise.all([
    fetchAllRows<EquipamientoSale>((from, to) =>
      supabase
        .from("equipamientos_sales")
        .select("*")
        .is("contact_id", null)
        .order("fecha", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<EquipamientoContact>((from, to) =>
      supabase.from("equipamientos_contacts").select("*").order("name").range(from, to)
    ),
  ]);

  return <VincularVentasView initialSales={sales ?? []} contacts={contacts ?? []} />;
}
