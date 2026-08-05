"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { parseFlexibleNumber } from "@/lib/excel";
import { addLedgerEntry } from "./actions";

const inputClass =
  "font-inter w-full rounded-xl border border-mh-border px-3 py-2 text-sm text-mh-ink focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-mh-ink";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Formulario único para "Nueva compra" y "Registrar pago": mismos campos y
// misma acción (addLedgerEntry) que ya usaban Cuenta Corriente/Pagos por
// separado en la ficha de cada proveedor — acá solo se agrega un punto de
// entrada rápido con el proveedor ya elegido.
export default function LedgerEntryModal({
  supplierId,
  supplierName,
  kind,
  onClose,
}: {
  supplierId: string;
  supplierName: string;
  kind: "compra" | "pago";
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    entry_date: todayISO(),
    concept: "",
    amount: "",
    payment_method: "",
    receipt_number: "",
    notes: "",
  });

  async function handleSave() {
    const amount = parseFlexibleNumber(form.amount);
    if (amount <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }
    if (kind === "compra" && !form.concept.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await addLedgerEntry({
      supplier_id: supplierId,
      entry_date: form.entry_date,
      kind,
      concept:
        kind === "compra"
          ? form.concept.trim()
          : `Pago${form.payment_method ? ` (${form.payment_method})` : ""}`,
      debit: kind === "compra" ? amount : 0,
      credit: kind === "pago" ? amount : 0,
      status: null,
      payment_method: kind === "pago" ? form.payment_method.trim() || null : null,
      receipt_number: kind === "pago" ? form.receipt_number.trim() || null : null,
      notes: form.notes.trim() || null,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal
      title={kind === "compra" ? `Nueva compra · ${supplierName}` : `Registrar pago · ${supplierName}`}
      onClose={onClose}
    >
      <div className="font-inter space-y-3">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <label className="block">
          <span className={labelClass}>Fecha</span>
          <input
            type="date"
            className={inputClass}
            value={form.entry_date}
            onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
          />
        </label>
        {kind === "compra" && (
          <label className="block">
            <span className={labelClass}>Concepto</span>
            <input
              className={inputClass}
              value={form.concept}
              onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
              placeholder="Ej. Compra de mercadería"
            />
          </label>
        )}
        <label className="block">
          <span className={labelClass}>Monto</span>
          <input
            className={inputClass}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </label>
        {kind === "pago" && (
          <>
            <label className="block">
              <span className={labelClass}>Medio de pago</span>
              <input
                className={inputClass}
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                placeholder="Ej. Transferencia, Efectivo, Cheque"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Comprobante</span>
              <input
                className={inputClass}
                value={form.receipt_number}
                onChange={(e) => setForm((f) => ({ ...f, receipt_number: e.target.value }))}
              />
            </label>
          </>
        )}
        <label className="block">
          <span className={labelClass}>Observaciones</span>
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : kind === "compra" ? "Guardar compra" : "Registrar pago"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
