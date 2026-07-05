import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit, MarketingPost } from "@/lib/types";
import MarketingCalendar from "./MarketingCalendar";

export default async function MarketingPage() {
  const supabase = await createClient();

  const [{ data: posts, error }, { data: businessUnits }] = await Promise.all([
    supabase
      .from("marketing_posts")
      .select("*")
      .order("publish_date", { ascending: true }),
    supabase.from("business_units").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Marketing</h1>
      <p className="text-sm text-slate-500">
        Cronograma de acciones de comunicación, organizado por mes.
      </p>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Error al cargar las acciones: {error.message}
        </p>
      )}

      <MarketingCalendar
        initialPosts={(posts ?? []) as MarketingPost[]}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
      />
    </div>
  );
}
