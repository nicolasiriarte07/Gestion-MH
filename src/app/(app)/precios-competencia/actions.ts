"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COMPETITOR_SEARCHERS, type CompetitorSiteKey } from "@/lib/competitor-sites";
import type { CompetitorPriceStatus } from "@/lib/types";

export async function searchCompetitorPrices(productId: string, query: string) {
  const supabase = await createClient();

  const { data: sites, error: sitesError } = await supabase
    .from("competitor_sites")
    .select("id, key, name")
    .order("name");

  if (sitesError) return { error: sitesError.message };
  if (!sites || sites.length === 0) {
    return { error: "No hay sitios de competencia configurados." };
  }

  await Promise.allSettled(
    sites.map(async (site) => {
      const searchFn = COMPETITOR_SEARCHERS[site.key as CompetitorSiteKey];
      let status: CompetitorPriceStatus = "not_found";
      let result: Awaited<ReturnType<typeof searchFn>> = null;

      try {
        result = searchFn ? await searchFn(query) : null;
        status = result ? "ok" : "not_found";
      } catch {
        status = "error";
      }

      await supabase.from("product_competitor_prices").upsert(
        {
          product_id: productId,
          site_id: site.id,
          matched_title: result?.title ?? null,
          matched_url: result?.url ?? null,
          price: result?.price ?? null,
          status,
          checked_at: new Date().toISOString(),
        },
        { onConflict: "product_id,site_id" }
      );
    })
  );

  revalidatePath("/precios-competencia");
  return { data: true };
}
