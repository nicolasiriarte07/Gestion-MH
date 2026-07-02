"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type GroupKey = {
  description: string;
  businessUnitId: string | null;
};

export async function confirmMatch(
  group: GroupKey,
  productId: string,
  confidence: number | null
) {
  const supabase = await createClient();
  let query = supabase
    .from("sale_items")
    .update({
      product_id: productId,
      match_status: "confirmed",
      match_confidence: confidence,
    })
    .eq("product_description_raw", group.description)
    .eq("match_status", "pending");
  query = group.businessUnitId
    ? query.eq("business_unit_id", group.businessUnitId)
    : query.is("business_unit_id", null);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/ventas");
  revalidatePath("/ventas/revisar");
  return { data: true };
}

export async function markNoMatch(group: GroupKey) {
  const supabase = await createClient();
  let query = supabase
    .from("sale_items")
    .update({
      product_id: null,
      match_status: "no_match",
      match_confidence: null,
    })
    .eq("product_description_raw", group.description)
    .eq("match_status", "pending");
  query = group.businessUnitId
    ? query.eq("business_unit_id", group.businessUnitId)
    : query.is("business_unit_id", null);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/ventas");
  revalidatePath("/ventas/revisar");
  return { data: true };
}
