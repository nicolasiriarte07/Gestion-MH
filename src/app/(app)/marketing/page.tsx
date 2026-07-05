import { createClient } from "@/lib/supabase/server";
import type { AdCampaign, BusinessUnit, MarketingPost } from "@/lib/types";
import MarketingCalendar from "./MarketingCalendar";
import PautaCalendar from "./PautaCalendar";
import MarketingTabs, { type MarketingTab } from "./MarketingTabs";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: MarketingTab = tab === "pauta" ? "pauta" : "organico";
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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Marketing</h1>
      <p className="text-sm text-slate-500">
        Cronograma de acciones de comunicación, organizado por mes.
      </p>

      <MarketingTabs active={activeTab} />

      {activeTab === "organico" ? (
        <>
          {postsError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al cargar las acciones: {postsError.message}
            </p>
          )}
          <MarketingCalendar
            initialPosts={(posts ?? []) as MarketingPost[]}
            businessUnits={(businessUnits ?? []) as BusinessUnit[]}
          />
        </>
      ) : (
        <>
          {campaignsError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al cargar las campañas: {campaignsError.message}
            </p>
          )}
          <PautaCalendar initialCampaigns={(campaigns ?? []) as AdCampaign[]} />
        </>
      )}
    </div>
  );
}
