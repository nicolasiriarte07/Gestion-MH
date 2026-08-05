"use client";

import { useState } from "react";
import type { AdCampaign, BusinessUnit, MarketingPost } from "@/lib/types";
import MarketingTabs, { type MarketingTab } from "./MarketingTabs";
import MarketingCalendar from "./MarketingCalendar";
import PautaCalendar from "./PautaCalendar";

// La vista "Lista" del brief es, literalmente, el módulo de antes: las
// tablas editables inline agrupadas por mes (Orgánico/Pauta), sin
// tocar su lógica. Las sub-tabs Orgánico/Pauta ahora viven en el
// cliente (antes eran ?tab= en la URL) para no recargar la página al
// cambiar entre las 4 vistas nuevas (Calendario/Agenda/Kanban/Lista).
export default function MarketingListView({
  posts,
  campaigns,
  businessUnits,
}: {
  posts: MarketingPost[];
  campaigns: AdCampaign[];
  businessUnits: BusinessUnit[];
}) {
  const [tab, setTab] = useState<MarketingTab>("organico");

  return (
    <div className="space-y-4">
      <MarketingTabs active={tab} onSelect={setTab} />
      {tab === "organico" ? (
        <MarketingCalendar initialPosts={posts} businessUnits={businessUnits} />
      ) : (
        <PautaCalendar initialCampaigns={campaigns} />
      )}
    </div>
  );
}
