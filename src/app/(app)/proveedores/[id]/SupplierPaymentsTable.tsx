"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierLedgerEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import Modal from "@/components/Modal";
import { addLedgerEntry, deleteLedgerEntry } from "../actions";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SupplierPaymentsTable({
  supplierId,
  payments,
}: {
  supplierId: string;
  payments: SupplierLedgerEntry[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    entry_date: todayISO(),
    amount: "",
    payment_method: "",
    receipt_number: "",
    notes: "",
  });

  async function handleRegister() {
    const amount = parseFlexibleNumber(form.amount);
    if (amount <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await addLedgerEntry({
      supplier_id: supplierId,
      entry_date: form.entry_date,
      kind: "pago",
      concept: `Pago${form.payment_method ? ` (${form.payment_method})` : ""}`,
      debit: 0,
      credit: amount,
      status: null,
      payment_method: form.payment_method.trim() || null,
      receipt_number: form.receipt_number.trim() || null,
      notes: form.notes.trim() || null,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setShowModal(false);
    setForm({
      entry_date: todayISO(),
      amount: "",
      payment_method: "",
      receipt_number: "",
      notes: "",
    });
    router.refresh();
  }

  async function handleDelete(payment: SupplierLedgerEntry) {
    if (!confirm("¿Eliminar este pago?")) return;

    setRemovingId(payment.id);
    const result = await deleteLedgerEntry(payment.id, supplierId);
    setRemovingId(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Registrar pago
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Monto</th>
              <th className="px-3 py-2 font-medium">Medio de pago</th>
              <th className="px-3 py-2 font-medium">Comprobante</th>
              <th className="px-3 py-2 font-medium">Observaciones</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {p.entry_date}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {formatCurrency(p.credit)}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {p.payment_method ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {p.receipt_number ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">{p.notes ?? "—"}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={removingId === p.id}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  Todavía no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Registrar pago" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Fecha</span>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                value={form.entry_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entry_date: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Monto</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Medio de pago
              </span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                value={form.payment_method}
                onChange={(e) =>
                  setForm((f) => ({ ...f, payment_method: e.target.value }))
                }
                placeholder="Ej. Transferencia, Efectivo, Cheque"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Comprobante
              </span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                value={form.receipt_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receipt_number: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Observaciones
              </span>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </label>
            <div className="flex justify-end">
              <button
                onClick={handleRegister}
                disabled={saving}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
