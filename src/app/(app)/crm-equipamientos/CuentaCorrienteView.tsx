"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";
import type { CrmInstallment, CrmInstallmentSale } from "@/lib/types";
import ReceivablesCalendarGrid, { type CalendarInstallment } from "./ReceivablesCalendarGrid";
import NewInstallmentSaleModal from "./NewInstallmentSaleModal";
import InstallmentSaleDrawer from "./InstallmentSaleDrawer";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CuentaCorrienteView({
  initialSales,
  initialInstallments,
}: {
  initialSales: CrmInstallmentSale[];
  initialInstallments: CrmInstallment[];
}) {
  const [sales, setSales] = useState<CrmInstallmentSale[]>(initialSales);
  const [installments, setInstallments] = useState<CrmInstallment[]>(initialInstallments);
  const [creating, setCreating] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const salesById = useMemo(() => new Map(sales.map((s) => [s.id, s])), [sales]);
  const clientNames = useMemo(
    () => [...new Set(sales.map((s) => s.client_name))].sort(),
    [sales]
  );

  const calendarInstallments: CalendarInstallment[] = useMemo(
    () =>
      installments.map((inst) => {
        const sale = salesById.get(inst.sale_id);
        return {
          ...inst,
          client_name: sale?.client_name ?? "—",
          product: sale?.product ?? "—",
        };
      }),
    [installments, salesById]
  );

  const today = todayISO();
  const pendingTotal = installments
    .filter((i) => !i.paid)
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = installments.filter((i) => !i.paid && i.due_date < today).length;

  const selectedSale = selectedSaleId ? (salesById.get(selectedSaleId) ?? null) : null;
  const selectedInstallments = useMemo(
    () =>
      selectedSaleId
        ? installments
            .filter((i) => i.sale_id === selectedSaleId)
            .sort((a, b) => a.installment_number - b.installment_number)
        : [],
    [installments, selectedSaleId]
  );

  function handleCreated(sale: CrmInstallmentSale, newInstallments: CrmInstallment[]) {
    setSales((prev) => [sale, ...prev]);
    setInstallments((prev) => [...prev, ...newInstallments]);
    setCreating(false);
  }

  function handleInstallmentToggled(updated: CrmInstallment) {
    setInstallments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleSaleDeleted(saleId: string) {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    setInstallments((prev) => prev.filter((i) => i.sale_id !== saleId));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-mh-ink">Cuenta corriente</h2>
          <p className="text-sm text-mh-ink-muted">
            Cuentas a cobrar de clientes financiados en cuotas.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Nueva venta
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <KpiCard
          icon={Wallet}
          tone="pink"
          label="Total pendiente de cobro"
          value={formatCurrency(pendingTotal)}
        />
        <KpiCard icon={AlertTriangle} tone="amber" label="Cuotas vencidas" value={String(overdueCount)} />
      </div>

      <ReceivablesCalendarGrid
        installments={calendarInstallments}
        onSelectInstallment={(inst) => setSelectedSaleId(inst.sale_id)}
      />

      {creating && (
        <NewInstallmentSaleModal
          clientNames={clientNames}
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
        />
      )}

      <InstallmentSaleDrawer
        sale={selectedSale}
        installments={selectedInstallments}
        onClose={() => setSelectedSaleId(null)}
        onInstallmentToggled={handleInstallmentToggled}
        onSaleDeleted={handleSaleDeleted}
      />
    </div>
  );
}
