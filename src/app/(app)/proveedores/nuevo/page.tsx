import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";
import SupplierForm from "../SupplierForm";

export default async function NuevoProveedorPage() {
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("id, name").order("name");

  return <SupplierForm mode="create" brands={(brands ?? []) as Brand[]} />;
}
