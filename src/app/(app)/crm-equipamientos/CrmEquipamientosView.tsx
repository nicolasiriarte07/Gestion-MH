"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import type { Product, SaleItem } from "@/lib/types";
import EquipamientosVentasView from "./EquipamientosVentasView";
import EquipamientosStockView from "./EquipamientosStockView";
import ContactsView from "./ContactsView";
import CrmTabs, { type CrmTab } from "./CrmTabs";
import type { ContactRow } from "./ContactsTable";

export default function CrmEquipamientosView({
  contactRows,
  totalCount,
  contactedThisWeek,
  staleCount,
  saleItems,
  stockProducts,
  categoryNameById,
  brandNameById,
}: {
  contactRows: ContactRow[];
  totalCount: number;
  contactedThisWeek: number;
  staleCount: number;
  saleItems: SaleItem[];
  stockProducts: Product[];
  categoryNameById: Record<string, string>;
  brandNameById: Record<string, string>;
}) {
  const [tab, setTab] = useState<CrmTab>("contactos");
  const categoryName = (id: string | null) => (id ? (categoryNameById[id] ?? "") : "");
  const brandName = (id: string | null) => (id ? (brandNameById[id] ?? "") : "");

  return (
    <div className="font-inter space-y-6">
      <CrmTabs active={tab} onSelect={setTab} />

      {tab === "contactos" && (
        <ContactsView
          rows={contactRows}
          totalCount={totalCount}
          contactedThisWeek={contactedThisWeek}
          staleCount={staleCount}
        />
      )}

      {tab === "ventas" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-mh-ink">Ventas — EQUIPAMIENTOS MH</h2>
            <p className="text-sm text-mh-ink-muted">
              Historial de ventas ordenado por fecha (más recientes primero).
            </p>
          </div>
          <EquipamientosVentasView rows={saleItems} />
        </div>
      )}

      {tab === "stock" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-mh-ink">Stock — EQUIPAMIENTOS MH</h2>
            <p className="text-sm text-mh-ink-muted">
              Stock de Inventario de esta unidad de negocio únicamente.
            </p>
          </div>
          <EquipamientosStockView
            rows={stockProducts}
            brandName={brandName}
            categoryName={categoryName}
          />
        </div>
      )}

      {tab === "cuenta_corriente" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Wallet size={28} className="text-mh-ink-muted" />
          <p className="text-sm font-semibold text-mh-ink">Cuenta corriente</p>
          <p className="max-w-sm text-sm text-mh-ink-muted">
            Todavía no está disponible — próximamente.
          </p>
        </div>
      )}
    </div>
  );
}
