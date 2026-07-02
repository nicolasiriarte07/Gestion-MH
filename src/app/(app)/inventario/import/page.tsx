import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit } from "@/lib/types";
import ImportForm from "./ImportForm";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name")
    .order("name");

  return <ImportForm businessUnits={(businessUnits ?? []) as BusinessUnit[]} />;
}
