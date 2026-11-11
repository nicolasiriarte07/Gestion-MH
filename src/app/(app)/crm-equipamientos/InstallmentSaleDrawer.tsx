"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import type { CrmInstallment, CrmInstallmentSale, InstallmentFrequency } from "@/lib/types";
import { deleteInstallmentSale, toggleInstallmentPaid } from "./actions";

const FREQUENCY_LABELS: Record<InstallmentFrequency, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
};

export default function InstallmentSaleDrawer({
  sale,
  installments,
  onClose,
  onInstallmentToggled,
  onSaleDeleted,
}: {
  sale: CrmInstallmentSale | null;
  installments: CrmInstallment[];
  onClose: () => void;
  onInstallmentToggled: (installment: CrmInstallment) => void;
  onSaleDeleted: (saleId: string) => void;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(inst: CrmInstallment) {
    setTogglingId(inst.id);
    setError(null);
    const result = await toggleInstallmentPaid(inst.id, !inst.paid);
    setTogglingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    onInstallmentToggled(result.data as CrmInstallment);
  }

  async function handleDelete() {
    if (!sale) return;
    if (!confirm(`¿Eliminar la venta de "${sale.client_name}" y todas sus cuotas?`)) return;
    setDeleting(true);
    const result = await deleteInstallmentSale(sale.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaleDeleted(sale.id);
    onClose();
  }

  const total = sale
    ? sale.down_payment + installments.reduce((sum, i) => sum + i.amount, 0)
    : 0;
  const pending = installments.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0);

  return (
    <Drawer open={sale !== null} onClose={onClose}>
      {sale && (
        <>
          <div className="border-b border-mh-border p-6">
            <Badge tone="pink">Venta en cuotas</Badge>
            <p className="mt-2 text-lg font-extrabold text-mh-ink">{sale.client_name}</p>
            <p className="text-sm text-mh-ink-muted">{sale.product}</p>
          </div>

          <div className="flex-1 space-y-4 p-6">
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-mh-ink-muted">Fecha de venta</p>
                <p className="font-semibold text-mh-ink">{sale.sale_date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-mh-ink-muted">Entrega</p>
                <p className="font-semibold text-mh-ink">{formatCurrency(sale.down_payment)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-mh-ink-muted">Frecuencia</p>
                <p className="font-semibold text-mh-ink">
                  {FREQUENCY_LABELS[sale.installment_frequency]}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-mh-ink-muted">Total del plan</p>
                <p className="font-semibold text-mh-ink">{formatCurrency(total)}</p>
              </div>
            </div>

            {sale.notes && (
              <p className="rounded-xl bg-mh-bg px-3 py-2 text-sm text-mh-ink-muted">
                {sale.notes}
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-bold text-mh-ink">
                Cuotas · {formatCurrency(pending)} pendiente
              </p>
              <div className="space-y-1.5">
                {installments.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handleToggle(inst)}
                    disabled={togglingId === inst.id}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-mh-border px-3 py-2.5 text-left hover:bg-mh-bg disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {inst.paid ? (
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                      ) : (
                        <Circle size={18} className="shrink-0 text-mh-ink-muted" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-mh-ink">
                          Cuota {inst.installment_number}
                        </p>
                        <p className="text-xs text-mh-ink-muted">Vence {inst.due_date}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-mh-ink">
                      {formatCurrency(inst.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-mh-border p-6">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Eliminar venta
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
