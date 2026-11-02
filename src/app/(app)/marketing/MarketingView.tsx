"use client";

import { useMemo, useState } from "react";
import type { AdCampaign, BusinessUnit, MarketingPost } from "@/lib/types";
import {
  itemStartDate,
  itemStatus,
  todayISO,
  type MarketingItem,
} from "./normalize";
import type { DonutRow } from "@/components/ds/Donut";
import MarketingHeader from "./MarketingHeader";
import MarketingViewTabs, { type MarketingView as ViewKey } from "./MarketingViewTabs";
import MarketingToolbar from "./MarketingToolbar";
import MarketingCalendarGrid from "./MarketingCalendarGrid";
import MarketingAgendaView from "./MarketingAgendaView";
import MarketingKanbanView from "./MarketingKanbanView";
import MarketingListView from "./MarketingListView";
import MarketingItemDrawer from "./MarketingItemDrawer";
import MarketingBottomDashboard, { type MonthlyPerformanceRow } from "./MarketingBottomDashboard";

const SHORT_MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function lastNMonthKeys(n: number): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: SHORT_MONTH_NAMES[d.getMonth()],
    };
  });
}

export default function MarketingView({
  posts,
  campaigns,
  businessUnits,
}: {
  posts: MarketingPost[];
  campaigns: AdCampaign[];
  businessUnits: BusinessUnit[];
}) {
  const [view, setView] = useState<ViewKey>("calendario");
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null);
  const today = todayISO();

  const items: MarketingItem[] = useMemo(
    () => [
      ...posts.map((data): MarketingItem => ({ kind: "post", data })),
      ...campaigns.map((data): MarketingItem => ({ kind: "campaign", data })),
    ],
    [posts, campaigns]
  );

  const upcomingActions = useMemo(
    () =>
      items
        .filter((i) => itemStartDate(i) >= today)
        .sort((a, b) => itemStartDate(a).localeCompare(itemStartDate(b)))
        .slice(0, 8),
    [items, today]
  );

  const campaignStatusRows: DonutRow[] = useMemo(() => {
    const counts = { programada: 0, en_curso: 0, finalizada: 0 };
    for (const c of campaigns) {
      counts[itemStatus({ kind: "campaign", data: c }, today)]++;
    }
    return [
      { label: "En curso", value: counts.en_curso },
      { label: "Programadas", value: counts.programada },
      { label: "Finalizadas", value: counts.finalizada },
    ];
  }, [campaigns, today]);

  const monthlyPerformance: MonthlyPerformanceRow[] = useMemo(() => {
    const months = lastNMonthKeys(6);
    return months.map(({ key, label }) => ({
      monthLabel: label,
      campaigns: campaigns.filter((c) => c.start_date.slice(0, 7) === key).length,
      posts: posts.filter((p) => p.is_published && p.publish_date.slice(0, 7) === key).length,
    }));
  }, [campaigns, posts]);

  return (
    <div className="font-inter space-y-8">
      <MarketingHeader
        subtitle={`${items.length} acción(es) de comunicación`}
        businessUnits={businessUnits}
      />

      <MarketingToolbar items={items} businessUnits={businessUnits} />

      <div className="min-w-0 space-y-4">
        <MarketingViewTabs active={view} onSelect={setView} />
        {view === "calendario" && (
          <MarketingCalendarGrid items={items} onSelectItem={setSelectedItem} />
        )}
        {view === "lista" && (
          <MarketingListView posts={posts} campaigns={campaigns} businessUnits={businessUnits} />
        )}
        {view === "agenda" && (
          <MarketingAgendaView items={items} onSelectItem={setSelectedItem} />
        )}
        {view === "kanban" && (
          <MarketingKanbanView items={items} onSelectItem={setSelectedItem} />
        )}
      </div>

      <MarketingBottomDashboard
        campaignStatusRows={campaignStatusRows}
        upcomingActions={upcomingActions}
        monthlyPerformance={monthlyPerformance}
      />

      <MarketingItemDrawer
        item={selectedItem}
        businessUnits={businessUnits}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
