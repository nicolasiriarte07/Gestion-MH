import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { EquipamientoSale } from "@/lib/types";
import SalesView from "./SalesView";

export default async function VentasEquipamientosPage() {
  const supabase = await createClient();

  const { data: sales } = await fetchAllRows<EquipamientoSale>((from, to) =>
    supabase
      .from("equipamientos_sales")
      .select("*")
      .order("fecha", { ascending: false })
      .range(from, to)
  );

  return <SalesView rows={sales ?? []} />;
}
