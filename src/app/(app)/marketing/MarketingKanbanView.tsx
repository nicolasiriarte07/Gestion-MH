import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import {
  itemStartDate,
  itemTitle,
  itemInvestment,
  itemStatus,
  statusLabel,
  todayISO,
  type MarketingItem,
  type MarketingStatus,
} from "./normalize";

const COLUMNS: MarketingStatus[] = ["programada", "en_curso", "finalizada"];

export default function MarketingKanbanView({
  items,
  onSelectItem,
}: {
  items: MarketingItem[];
  onSelectItem: (item: MarketingItem) => void;
}) {
  const today = todayISO();
  const byStatus = new Map<MarketingStatus, MarketingItem[]>(COLUMNS.map((s) => [s, []]));
  for (const item of items) {
    byStatus.get(itemStatus(item, today))!.push(item);
  }
  for (const list of byStatus.values()) {
    list.sort((a, b) => itemStartDate(a).localeCompare(itemStartDate(b)));
  }

  return (
    <div className="font-inter grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((status) => {
        const columnItems = byStatus.get(status) ?? [];
        return (
          <div key={status} className="min-w-0 space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-bold text-mh-ink">{statusLabel(status)}</p>
              <span className="rounded-full bg-mh-bg px-2 py-0.5 text-xs font-semibold text-mh-ink-muted">
                {columnItems.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnItems.length === 0 ? (
                <Card padding="sm" className="border-dashed">
                  <p className="text-center text-xs text-mh-ink-muted">Sin items acá.</p>
                </Card>
              ) : (
                columnItems.map((item) => (
                  <button
                    key={`${item.kind}-${item.data.id}`}
                    onClick={() => onSelectItem(item)}
                    className="block w-full text-left"
                  >
                    <Card padding="sm" className="hover:border-mh-pink/40">
                      <Badge tone={item.kind === "post" ? "pink" : "blue"}>
                        {item.kind === "post" ? "Orgánico" : "Pauta"}
                      </Badge>
                      <p className="mt-2 truncate text-sm font-bold text-mh-ink">
                        {itemTitle(item)}
                      </p>
                      <p className="mt-1 text-xs text-mh-ink-muted">
                        {itemStartDate(item)} · {formatCurrency(itemInvestment(item))}
                      </p>
                    </Card>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
