import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import {
  itemStartDate,
  itemTitle,
  itemInvestment,
  itemStatus,
  statusLabel,
  statusTone,
  todayISO,
  type MarketingItem,
} from "./normalize";

function formatDayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MarketingAgendaView({
  items,
  onSelectItem,
}: {
  items: MarketingItem[];
  onSelectItem: (item: MarketingItem) => void;
}) {
  const today = todayISO();

  const byDay = new Map<string, MarketingItem[]>();
  for (const item of items) {
    const day = itemStartDate(item);
    const list = byDay.get(day) ?? [];
    list.push(item);
    byDay.set(day, list);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (days.length === 0) {
    return (
      <Card padding="sm" className="font-inter">
        <p className="py-8 text-center text-sm text-mh-ink-muted">
          Todavía no hay campañas ni publicaciones cargadas.
        </p>
      </Card>
    );
  }

  return (
    <div className="font-inter space-y-4">
      {days.map(([day, dayItems]) => (
        <Card key={day} padding="sm">
          <p className="mb-3 text-sm font-bold text-mh-ink capitalize">
            {formatDayLabel(day)}
            {day === today && <span className="ml-2 text-mh-pink">· Hoy</span>}
          </p>
          <div className="space-y-2">
            {dayItems.map((item) => {
              const status = itemStatus(item, today);
              return (
                <button
                  key={`${item.kind}-${item.data.id}`}
                  onClick={() => onSelectItem(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-mh-border px-4 py-3 text-left hover:bg-mh-pink-light/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-mh-ink">{itemTitle(item)}</p>
                    <p className="text-xs text-mh-ink-muted">
                      {item.kind === "post" ? "Publicación orgánica" : "Campaña de pauta"} ·{" "}
                      {formatCurrency(itemInvestment(item))}
                    </p>
                  </div>
                  <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
                </button>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
