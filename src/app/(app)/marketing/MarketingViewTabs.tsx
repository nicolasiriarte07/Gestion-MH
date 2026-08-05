import { CalendarDays, List, Kanban, ListTodo } from "lucide-react";

export type MarketingView = "calendario" | "agenda" | "kanban" | "lista";

const VIEWS: { key: MarketingView; label: string; icon: typeof CalendarDays }[] = [
  { key: "calendario", label: "Calendario", icon: CalendarDays },
  { key: "agenda", label: "Agenda", icon: ListTodo },
  { key: "kanban", label: "Kanban", icon: Kanban },
  { key: "lista", label: "Lista", icon: List },
];

// Las 4 vistas leen exactamente los mismos posts/campañas (ver
// normalize.ts): esto solo cambia cómo se muestran, no hay ninguna
// consulta ni filtro distinto entre una y otra.
export default function MarketingViewTabs({
  active,
  onSelect,
}: {
  active: MarketingView;
  onSelect: (view: MarketingView) => void;
}) {
  return (
    <div className="font-inter inline-flex gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const isActive = v.key === active;
        return (
          <button
            key={v.key}
            onClick={() => onSelect(v.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
