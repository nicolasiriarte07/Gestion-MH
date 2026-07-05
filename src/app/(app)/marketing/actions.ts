"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentType } from "@/lib/types";

export type MarketingPostInput = {
  concept: string;
  business_unit_id: string | null;
  publish_date: string;
  content_type: ContentType | null;
  is_scheduled: boolean;
  investment_ars: number;
};

export async function createMarketingPost(input: MarketingPostInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketing_posts")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data };
}

export async function updateMarketingPost(
  id: string,
  patch: Partial<MarketingPostInput>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketing_posts")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data };
}

export async function deleteMarketingPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_posts")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data: true };
}
