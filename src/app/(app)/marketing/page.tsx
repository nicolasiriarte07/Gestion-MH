import { createClient } from "@/lib/supabase/server";
import type { AdCampaign, BusinessUnit, MarketingPost } from "@/lib/types";
import MarketingView from "./MarketingView";

export default async function MarketingPage() {
  const supabase = await createClient();

  const [
    { data: posts, error: postsError },
    { data: businessUnits },
    { data: campaigns, error: campaignsError },
  ] = await Promise.all([
    supabase
      .from("marketing_posts")
      .select("*")
      .order("publish_date", { ascending: true }),
    supabase.from("business_units").select("id, name").order("name"),
    supabase
      .from("ad_campaigns")
      .select("*")
      .order("start_date", { ascending: true }),
  ]);

  return (
    <div className="font-inter space-y-4">
      {postsError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Error al cargar las acciones: {postsError.message}
        </p>
      )}
      {campaignsError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Error al cargar las campañas: {campaignsError.message}
        </p>
      )}
      <MarketingView
        posts={(posts ?? []) as MarketingPost[]}
        campaigns={(campaigns ?? []) as AdCampaign[]}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
      />
    </div>
  );
}
