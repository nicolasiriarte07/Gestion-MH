"use client";

import { useMemo, useState } from "react";
import { Users2, Sparkles, Megaphone, Wallet, TrendingUp } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";
import type { AdCampaign, BusinessUnit, MarketingPost } from "@/lib/types";
import {
  itemStartDate,
  itemInvestment,
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
import MarketingSummaryPanel from "./MarketingSummaryPanel";
import MarketingItemDrawer from "./MarketingItemDrawer";
import MarketingBottomDashboard, { type MonthlyPerformanceRow } from "./MarketingBottomDashboard";

const UPCOMING_DEADLINE_DAYS = 14;
const SHORT_MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const reachFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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

  const kpis = useMemo(() => {
    const activeCampaigns = campaigns.filter(
      (c) => itemStatus({ kind: "campaign", data: c }, today) === "en_curso"
    ).length;
    const scheduledPosts = posts.filter(
      (p) => itemStatus({ kind: "post", data: p }, today) === "programada"
    ).length;
    const estimatedReach = campaigns.reduce((s, c) => s + c.reach, 0);
    const thisMonth = today.slice(0, 7);
    const itemsThisMonth = items.filter((i) => itemStartDate(i).slice(0, 7) === thisMonth);
    const investmentThisMonth = itemsThisMonth.reduce((s, i) => s + itemInvestment(i), 0);
    return {
      activeCampaigns,
      scheduledPosts,
      estimatedReach,
      investmentThisMonth,
      actionsThisMonth: itemsThisMonth.length,
    };
  }, [campaigns, posts, items, today]);

  const upcomingCampaigns = useMemo(
    () =>
      items
        .filter((i) => i.kind === "campaign" && itemStartDate(i) >= today)
        .sort((a, b) => itemStartDate(a).localeCompare(itemStartDate(b)))
        .slice(0, 5),
    [items, today]
  );

  const postsToday = useMemo(
    () => items.filter((i) => i.kind === "post" && itemStartDate(i) === today),
    [items, today]
  );

  const upcomingDeadlines = useMemo(() => {
    const limit = daysFromNowISO(UPCOMING_DEADLINE_DAYS);
    return items
      .filter((i) => i.kind === "campaign" && i.data.end_date >= today && i.data.end_date <= limit)
      .sort((a, b) => (a.data as AdCampaign).end_date.localeCompare((b.data as AdCampaign).end_date))
      .slice(0, 5);
  }, [items, today]);

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={Megaphone} tone="pink" label="Campañas activas" value={String(kpis.activeCampaigns)} />
        <KpiCard icon={Sparkles} tone="blue" label="Publicaciones programadas" value={String(kpis.scheduledPosts)} />
        <KpiCard icon={Users2} tone="blue-light" label="Alcance estimado" value={reachFormatter.format(kpis.estimatedReach)} />
        <KpiCard
          icon={Wallet}
          tone="pink"
          label="Inversión total"
          value={formatCurrency(kpis.investmentThisMonth)}
          sublabel="este mes"
        />
        <KpiCard icon={TrendingUp} tone="gray" label="Acciones este mes" value={String(kpis.actionsThisMonth)} />
      </div>

      <MarketingToolbar items={items} businessUnits={businessUnits} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr]">
        <div className="min-w-0 space-y-4">
          <MarketingViewTabs active={view} onSelect={setView} />
          {view === "calendario" && (
            <MarketingCalendarGrid items={items} onSelectItem={setSelectedItem} />
          )}
          {view === "agenda" && (
            <MarketingAgendaView items={items} onSelectItem={setSelectedItem} />
          )}
          {view === "kanban" && (
            <MarketingKanbanView items={items} onSelectItem={setSelectedItem} />
          )}
          {view === "lista" && (
            <MarketingListView posts={posts} campaigns={campaigns} businessUnits={businessUnits} />
          )}
        </div>
        <MarketingSummaryPanel
          upcomingCampaigns={upcomingCampaigns}
          postsToday={postsToday}
          upcomingDeadlines={upcomingDeadlines}
          businessUnits={businessUnits}
          onSelectItem={setSelectedItem}
        />
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
