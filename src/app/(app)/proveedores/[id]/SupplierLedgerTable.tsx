"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { LedgerKind, SupplierLedgerEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import Modal from "@/components/Modal";
import Card from "@/components/ds/Card";
import { addLedgerEntry, deleteLedgerEntry } from "../actions";

const KIND_LABELS: Record<LedgerKind, string> = {
  compra: "Compra",
  pago: "Pago",
  ajuste: "Ajuste",
  nota_credito: "Nota de crédito",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SupplierLedgerTable({
  supplierId,
  entries,
}: {
  supplierId: string;
  entries: SupplierLedgerEntry[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    entry_date: todayISO(),
    kind: "ajuste" as LedgerKind,
    concept: "",
    debit: "",
    credit: "",
    status: "",
    notes: "",
  });

  const rowsWithBalance = useMemo(() => {
    return entries.reduce<(SupplierLedgerEntry & { runningBalance: number })[]>(
      (rows, e) => {
        const previousBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
        rows.push({ ...e, runningBalance: previousBalance + e.debit - e.credit });
        return rows;
      },
      []
    );
  }, [entries]);

  const currentBalance =
    rowsWithBalance.length > 0
      ? rowsWithBalance[rowsWithBalance.length - 1].runningBalance
      : 0;

  async function handleAdd() {
    if (!form.concept.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);

    const result = await addLedgerEntry({
      supplier_id: supplierId,
      entry_date: form.entry_date,
      kind: form.kind,
      concept: form.concept.trim(),
      debit: parseFlexibleNumber(form.debit),
      credit: parseFlexibleNumber(form.credit),
      status: form.status.trim() || null,
      payment_method: null,
      receipt_number: null,
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
      kind: "ajuste",
      concept: "",
      debit: "",
      credit: "",
      status: "",
      notes: "",
    });
    router.refresh();
  }

  async function handleDelete(entry: SupplierLedgerEntry) {
    if (!confirm(`¿Eliminar el movimiento "${entry.concept}"?`)) return;

    setRemovingId(entry.id);
    const result = await deleteLedgerEntry(entry.id, supplierId);
    setRemovingId(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="font-inter space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-mh-ink-muted">Saldo actual</p>
          <p
            className={`text-2xl font-extrabold ${currentBalance > 0 ? "text-red-600" : "text-mh-ink"}`}
          >
            {formatCurrency(currentBalance)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Agregar movimiento
        </button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-3 py-3">Concepto</th>
                <th className="px-3 py-3">Debe</th>
                <th className="px-3 py-3">Haber</th>
                <th className="px-3 py-3">Saldo</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rowsWithBalance.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-mh-border/70 last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-mh-ink-muted">
                    {row.entry_date}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-mh-ink">
                      {row.concept}
                    </span>{" "}
                    <span className="text-mh-ink-muted">
                      ({KIND_LABELS[row.kind]})
                    </span>
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                  </td>
                  <td className="px-3 py-3 font-bold text-mh-ink">
                    {formatCurrency(row.runningBalance)}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.status ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={removingId === row.id}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {rowsWithBalance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-mh-ink-muted">
                    Todavía no hay movimientos en la cuenta corriente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal title="Agregar movimiento" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">Tipo</span>
              <select
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value as LedgerKind }))
                }
              >
                {(Object.entries(KIND_LABELS) as [LedgerKind, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
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
              <span className="mb-1 block font-semibold text-mh-ink">
                Concepto
              </span>
              <input
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.concept}
                onChange={(e) =>
                  setForm((f) => ({ ...f, concept: e.target.value }))
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-mh-ink">
                  Debe
                </span>
                <input
                  className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                  value={form.debit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, debit: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-mh-ink">
                  Haber
                </span>
                <input
                  className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                  value={form.credit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, credit: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">
                Estado
              </span>
              <input
                className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                placeholder="Ej. Pendiente, Pagado, Vencido"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-mh-ink">
                Notas
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
                onClick={handleAdd}
                disabled={saving}
                className="rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar movimiento"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
