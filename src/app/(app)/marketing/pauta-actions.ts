"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdCampaignInput = {
  campaign_name: string;
  investment_ars: number;
  reach: number;
  start_date: string;
  end_date: string;
};

export async function createAdCampaign(input: AdCampaignInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data };
}

export async function updateAdCampaign(
  id: string,
  patch: Partial<AdCampaignInput>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data };
}

export async function deleteAdCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ad_campaigns")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/marketing");
  return { data: true };
}
