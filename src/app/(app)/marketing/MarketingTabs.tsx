"use client";

import { Sprout, Target } from "lucide-react";

const TABS = [
  { key: "organico", label: "Orgánico", icon: Sprout },
  { key: "pauta", label: "Pauta", icon: Target },
] as const;

export type MarketingTab = (typeof TABS)[number]["key"];

export default function MarketingTabs({
  active,
  onSelect,
}: {
  active: MarketingTab;
  onSelect: (tab: MarketingTab) => void;
}) {
  return (
    <div className="font-inter flex justify-center">
      <div className="inline-flex gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-mh-pink text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  : "text-mh-ink-muted hover:bg-slate-50 hover:text-mh-ink"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
