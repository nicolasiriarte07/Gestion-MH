"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wallet,
  CreditCard,
  FileText,
  History,
} from "lucide-react";

const TABS = [
  { key: "resumen", label: "Resumen", icon: LayoutDashboard },
  { key: "productos", label: "Productos", icon: Package },
  { key: "cuenta-corriente", label: "Cuenta Corriente", icon: Wallet },
  { key: "pagos", label: "Pagos", icon: CreditCard },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "historial", label: "Historial", icon: History },
] as const;

export type SupplierTab = (typeof TABS)[number]["key"];

export default function SupplierTabs({ active }: { active: SupplierTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectTab(key: SupplierTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="font-inter flex flex-wrap gap-1 rounded-2xl border border-mh-border bg-mh-surface p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => selectTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
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
  );
}
