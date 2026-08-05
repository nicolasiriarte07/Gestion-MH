"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { SupplierLedgerEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import Modal from "@/components/Modal";
import Card from "@/components/ds/Card";
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
    <div className="font-inter space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Registrar pago
        </button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-3 py-3">Monto</th>
                <th className="px-3 py-3">Medio de pago</th>
                <th className="px-3 py-3">Comprobante</th>
                <th className="px-3 py-3">Observaciones</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-mh-border/70 last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-mh-ink-muted">
                    {p.entry_date}
                  </td>
                  <td className="px-3 py-3 font-bold text-mh-ink">
                    {formatCurrency(p.credit)}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {p.payment_method ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {p.receipt_number ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">{p.notes ?? "—"}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={removingId === p.id}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-mh-ink-muted">
                    Todavía no hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal title="Registrar pago" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">Fecha</span>
              <input
                type="date"
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.entry_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entry_date: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">Monto</span>
              <input
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">
                Medio de pago
              </span>
              <input
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.payment_method}
                onChange={(e) =>
                  setForm((f) => ({ ...f, payment_method: e.target.value }))
                }
                placeholder="Ej. Transferencia, Efectivo, Cheque"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">
                Comprobante
              </span>
              <input
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.receipt_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receipt_number: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">
                Observaciones
              </span>
              <textarea
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
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
                className="rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
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
