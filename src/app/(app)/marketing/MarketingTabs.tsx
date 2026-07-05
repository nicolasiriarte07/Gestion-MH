"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sprout, Target } from "lucide-react";

const TABS = [
  { key: "organico", label: "Orgánico", icon: Sprout },
  { key: "pauta", label: "Pauta", icon: Target },
] as const;

export type MarketingTab = (typeof TABS)[number]["key"];

export default function MarketingTabs({ active }: { active: MarketingTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectTab(key: MarketingTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex justify-center">
      <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => selectTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
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
