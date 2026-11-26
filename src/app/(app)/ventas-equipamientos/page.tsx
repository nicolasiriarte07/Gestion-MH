import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { EquipamientoContact, EquipamientoSale } from "@/lib/types";
import SalesView from "./SalesView";

export default async function VentasEquipamientosPage() {
  const supabase = await createClient();

  const [{ data: sales }, { data: contacts }] = await Promise.all([
    fetchAllRows<EquipamientoSale>((from, to) =>
      supabase
        .from("equipamientos_sales")
        .select("*")
        .order("fecha", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<EquipamientoContact>((from, to) =>
      supabase.from("equipamientos_contacts").select("*").order("name").range(from, to)
    ),
  ]);

  return <SalesView rows={sales ?? []} contacts={contacts ?? []} />;
}
