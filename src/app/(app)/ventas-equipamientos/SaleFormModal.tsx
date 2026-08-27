"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import { SALE_PAYMENT_METHODS, type EquipamientoSale } from "@/lib/types";
import { createSale, updateSale, type SaleInput } from "./actions";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

function emptyInput(): SaleInput {
  return {
    cliente: "",
    comercio: null,
    mes: null,
    fecha: null,
    producto: "",
    categoria: null,
    monto: 0,
    metodo_pago: null,
    entrega_inicial: 0,
    cuota_semanal: null,
    semanas_pagadas: 0,
    comentario: null,
    cobrado: false,
    entregado: false,
  };
}

export default function SaleFormModal({
  sale,
  categoryOptions,
  onClose,
  onSaved,
}: {
  sale: EquipamientoSale | null;
  categoryOptions: string[];
  onClose: () => void;
  onSaved: (sale: EquipamientoSale) => void;
}) {
  const [form, setForm] = useState<SaleInput>(
    sale
      ? {
          cliente: sale.cliente,
          comercio: sale.comercio,
          mes: sale.mes,
          fecha: sale.fecha,
          producto: sale.producto,
          categoria: sale.categoria,
          monto: sale.monto,
          metodo_pago: sale.metodo_pago,
          entrega_inicial: sale.entrega_inicial,
          cuota_semanal: sale.cuota_semanal,
          semanas_pagadas: sale.semanas_pagadas,
          comentario: sale.comentario,
          cobrado: sale.cobrado,
          entregado: sale.entregado,
        }
      : emptyInput()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(fields: Partial<SaleInput>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim() || !form.producto.trim()) {
      setError("Cliente y producto son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = sale ? await updateSale(sale.id, form) : await createSale(form);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result.data as EquipamientoSale);
  }

  return (
    <Modal title={sale ? "Editar venta" : "Nueva venta"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cliente</label>
            <input
              autoFocus
              className={inputClass}
              value={form.cliente}
              onChange={(e) => patch({ cliente: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Comercio</label>
            <input
              className={inputClass}
              value={form.comercio ?? ""}
              onChange={(e) => patch({ comercio: e.target.value || null })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Producto</label>
          <input
            className={inputClass}
            value={form.producto}
            onChange={(e) => patch({ producto: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Categoría</label>
            <input
              list="sale-category-options"
              className={inputClass}
              value={form.categoria ?? ""}
              onChange={(e) => patch({ categoria: e.target.value || null })}
            />
            <datalist id="sale-category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Fecha</label>
            <input
              type="date"
              className={inputClass}
              value={form.fecha ?? ""}
              onChange={(e) => patch({ fecha: e.target.value || null })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Mes</label>
          <input
            placeholder="Ej: Julio 2026"
            className={inputClass}
            value={form.mes ?? ""}
            onChange={(e) => patch({ mes: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Monto</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.monto ? formatCurrency(form.monto) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => patch({ monto: parseFlexibleNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Entrega inicial</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.entrega_inicial ? formatCurrency(form.entrega_inicial) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => patch({ entrega_inicial: parseFlexibleNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Cuota semanal</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.cuota_semanal ? formatCurrency(form.cuota_semanal) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) =>
                patch({
                  cuota_semanal: e.target.value.trim()
                    ? parseFlexibleNumber(e.target.value)
                    : null,
                })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Método</label>
            <select
              className={inputClass}
              value={form.metodo_pago ?? ""}
              onChange={(e) =>
                patch({
                  metodo_pago: (e.target.value || null) as SaleInput["metodo_pago"],
                })
              }
            >
              <option value="">Sin especificar</option>
              {SALE_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Semanas pagadas</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.semanas_pagadas}
            onChange={(e) => patch({ semanas_pagadas: Number(e.target.value) || 0 })}
          />
        </div>

        <div>
          <label className={labelClass}>Comentario</label>
          <textarea
            rows={2}
            className={inputClass}
            value={form.comentario ?? ""}
            onChange={(e) => patch({ comentario: e.target.value || null })}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
            <input
              type="checkbox"
              className="accent-mh-pink"
              checked={form.cobrado}
              onChange={(e) => patch({ cobrado: e.target.checked })}
            />
            Cobrado
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
            <input
              type="checkbox"
              className="accent-mh-pink"
              checked={form.entregado}
              onChange={(e) => patch({ entregado: e.target.checked })}
            />
            Entregado
          </label>
        </div>

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
