"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/currency";
import {
  INSTALLMENT_FREQUENCIES,
  type CrmInstallment,
  type CrmInstallmentSale,
  type InstallmentFrequency,
} from "@/lib/types";
import { createInstallmentSale } from "./actions";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

const FREQUENCY_LABELS: Record<InstallmentFrequency, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewInstallmentSaleModal({
  clientNames,
  onClose,
  onCreated,
}: {
  clientNames: string[];
  onClose: () => void;
  onCreated: (sale: CrmInstallmentSale, installments: CrmInstallment[]) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [product, setProduct] = useState("");
  const [saleDate, setSaleDate] = useState(todayISO());
  const [downPayment, setDownPayment] = useState("");
  const [frequency, setFrequency] = useState<InstallmentFrequency>("mensual");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = Number(installmentsCount) || 0;
  const amount = Number(installmentAmount) || 0;
  const total = (Number(downPayment) || 0) + count * amount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return setError("El cliente es obligatorio.");
    if (!product.trim()) return setError("El producto es obligatorio.");
    if (!firstDueDate) return setError("Elegí la fecha de la primera cuota.");
    if (count <= 0) return setError("La cantidad de cuotas debe ser mayor a 0.");
    if (amount <= 0) return setError("El monto de cada cuota debe ser mayor a 0.");

    setSaving(true);
    setError(null);
    const result = await createInstallmentSale({
      client_name: clientName.trim(),
      product: product.trim(),
      sale_date: saleDate,
      down_payment: Number(downPayment) || 0,
      installment_frequency: frequency,
      installment_amount: amount,
      notes: notes.trim() || null,
      installments_count: count,
      first_due_date: firstDueDate,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    const { sale, installments } = result.data as {
      sale: CrmInstallmentSale;
      installments: CrmInstallment[];
    };
    onCreated(sale, installments);
  }

  return (
    <Modal title="Nueva venta en cuotas" onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div>
          <label className={labelClass}>Cliente</label>
          <input
            autoFocus
            list="crm-installment-client-names"
            className={inputClass}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <datalist id="crm-installment-client-names">
            {clientNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass}>Producto</label>
          <input className={inputClass} value={product} onChange={(e) => setProduct(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha de venta</label>
            <input
              type="date"
              className={inputClass}
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Entrega</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Frecuencia de cuota</label>
            <select
              className={inputClass}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as InstallmentFrequency)}
            >
              {INSTALLMENT_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Monto de cada cuota</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cantidad de cuotas</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de la 1ª cuota</label>
            <input
              type="date"
              className={inputClass}
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notas (opcional)</label>
          <textarea
            className={inputClass}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {count > 0 && amount > 0 && (
          <p className="rounded-xl bg-mh-bg px-3 py-2 text-sm text-mh-ink-muted">
            Total del plan: <span className="font-bold text-mh-ink">{formatCurrency(total)}</span> (
            {count} cuota{count === 1 ? "" : "s"} de {formatCurrency(amount)})
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-mh-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-mh-ink-muted hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
