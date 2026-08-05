"use client";

import { useState } from "react";
import { Plus, Sparkles, Clock } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { BusinessUnit } from "@/lib/types";
import MarketingQuickCreateModal from "./MarketingQuickCreateModal";
import { itemTitle, itemStartDate, itemEndDate, itemInvestment, type MarketingItem } from "./normalize";

function ItemRow({ item, onClick }: { item: MarketingItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-mh-pink-light/30"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-mh-ink">{itemTitle(item)}</p>
        <p className="text-xs text-mh-ink-muted">{itemStartDate(item)}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-mh-ink-muted">
        {formatCurrency(itemInvestment(item))}
      </span>
    </button>
  );
}

export default function MarketingSummaryPanel({
  upcomingCampaigns,
  postsToday,
  upcomingDeadlines,
  businessUnits,
  onSelectItem,
}: {
  upcomingCampaigns: MarketingItem[];
  postsToday: MarketingItem[];
  upcomingDeadlines: MarketingItem[];
  businessUnits: BusinessUnit[];
  onSelectItem: (item: MarketingItem) => void;
}) {
  const [creating, setCreating] = useState<"post" | "campaign" | null>(null);

  return (
    <div className="font-inter space-y-4">
      <Card padding="sm">
        <p className="mb-2 text-sm font-bold text-mh-ink">Próximas campañas</p>
        {upcomingCampaigns.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">No hay campañas próximas.</p>
        ) : (
          <div className="space-y-1">
            {upcomingCampaigns.map((item) => (
              <ItemRow key={`${item.kind}-${item.data.id}`} item={item} onClick={() => onSelectItem(item)} />
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <p className="mb-2 text-sm font-bold text-mh-ink">Publicaciones de hoy</p>
        {postsToday.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">No hay publicaciones para hoy.</p>
        ) : (
          <div className="space-y-1">
            {postsToday.map((item) => (
              <ItemRow key={`${item.kind}-${item.data.id}`} item={item} onClick={() => onSelectItem(item)} />
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-mh-ink">
          <Clock size={14} />
          Próximos vencimientos
        </p>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">Ninguna campaña vence en los próximos 14 días.</p>
        ) : (
          <div className="space-y-1">
            {upcomingDeadlines.map((item) => (
              <button
                key={`${item.kind}-${item.data.id}`}
                onClick={() => onSelectItem(item)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-mh-pink-light/30"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-mh-ink">
                  {itemTitle(item)}
                </span>
                <span className="shrink-0 text-xs font-medium text-red-600">
                  vence {itemEndDate(item)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <p className="mb-3 text-sm font-bold text-mh-ink">Acciones rápidas</p>
        <div className="space-y-2">
          <button
            onClick={() => setCreating("campaign")}
            className="flex w-full items-center gap-2 rounded-xl border border-mh-border px-3 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
          >
            <Plus size={16} />
            Nueva campaña
          </button>
          <button
            onClick={() => setCreating("post")}
            className="flex w-full items-center gap-2 rounded-xl border border-mh-border px-3 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
          >
            <Sparkles size={16} />
            Nueva publicación
          </button>
        </div>
      </Card>

      {creating && (
        <MarketingQuickCreateModal
          kind={creating}
          businessUnits={businessUnits}
          onClose={() => setCreating(null)}
        />
      )}
    </div>
  );
}
