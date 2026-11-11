"use client";

import { useState } from "react";
import type { CrmInstallment, CrmInstallmentSale, Product, SaleItem } from "@/lib/types";
import EquipamientosVentasView from "./EquipamientosVentasView";
import EquipamientosStockView from "./EquipamientosStockView";
import ContactsView from "./ContactsView";
import CuentaCorrienteView from "./CuentaCorrienteView";
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
  installmentSales,
  installments,
}: {
  contactRows: ContactRow[];
  totalCount: number;
  contactedThisWeek: number;
  staleCount: number;
  saleItems: SaleItem[];
  stockProducts: Product[];
  categoryNameById: Record<string, string>;
  brandNameById: Record<string, string>;
  installmentSales: CrmInstallmentSale[];
  installments: CrmInstallment[];
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
        <CuentaCorrienteView initialSales={installmentSales} initialInstallments={installments} />
      )}
    </div>
  );
}
