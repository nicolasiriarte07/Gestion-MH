import { Users, Receipt, Wallet, Package } from "lucide-react";

export type CrmTab = "contactos" | "ventas" | "stock" | "cuenta_corriente";

const TABS: { key: CrmTab; label: string; icon: typeof Users }[] = [
  { key: "contactos", label: "Gestión de contactos", icon: Users },
  { key: "ventas", label: "Ventas", icon: Receipt },
  { key: "stock", label: "Stock", icon: Package },
  { key: "cuenta_corriente", label: "Cuenta corriente", icon: Wallet },
];

export default function CrmTabs({
  active,
  onSelect,
}: {
  active: CrmTab;
  onSelect: (tab: CrmTab) => void;
}) {
  return (
    <div className="font-inter inline-flex gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
