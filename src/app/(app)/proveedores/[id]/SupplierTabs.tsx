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
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => selectTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
  );
}
