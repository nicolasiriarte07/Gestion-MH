"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Input from "@/components/ds/Input";
import Select from "@/components/ds/Select";
import Button from "@/components/ds/Button";
import { formatCurrency } from "@/lib/currency";
import type { Brand, Product, PurchaseOrder, PurchaseOrderItem } from "@/lib/types";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { createPurchaseOrder, updatePurchaseOrderFull } from "./actions";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

const PAYMENT_TYPE_OPTIONS = [
  "Contra entrega",
  "Contado",
  "Cuenta corriente",
  "Transferencia",
  "Cheque",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type DraftLine = {
  key: string;
  productId: string | null;
  description: string;
  quantity: string;
  amount: string;
  showDropdown: boolean;
};

function emptyLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    productId: null,
    description: "",
    quantity: "1",
    amount: "",
    showDropdown: false,
  };
}

export default function NewPurchaseOrderModal({
  businessUnitId,
  brands,
  products,
  editOrder,
  onClose,
  onSaved,
}: {
  businessUnitId: string;
  brands: Brand[];
  products: Product[];
  // Si viene cargado, el modal edita ese pedido (y sus líneas) en vez
  // de crear uno nuevo.
  editOrder?: PurchaseOrderRow | null;
  onClose: () => void;
  onSaved: (order: PurchaseOrder, items: PurchaseOrderItem[]) => void;
}) {
  const isEditing = !!editOrder;
  const [orderDate, setOrderDate] = useState(editOrder?.order_date ?? todayISO());
  const [brandId, setBrandId] = useState(editOrder?.brand_id ?? "");
  const [traveler, setTraveler] = useState(editOrder?.traveler ?? "");
  const [travelerPhone, setTravelerPhone] = useState(editOrder?.traveler_phone ?? "");
  const [paymentType, setPaymentType] = useState(editOrder?.payment_type ?? "");
  const [arrivalDate, setArrivalDate] = useState(editOrder?.arrival_date ?? "");
  const [lines, setLines] = useState<DraftLine[]>(
    editOrder && editOrder.items.length > 0
      ? editOrder.items.map((i) => ({
          key: i.id,
          productId: i.product_id,
          description: i.product_description,
          quantity: String(i.quantity),
          amount: String(i.amount),
          showDropdown: false,
        }))
      : [emptyLine()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function pickProduct(key: string, product: Product) {
    updateLine(key, {
      productId: product.id,
      description: product.description,
      showDropdown: false,
    });
  }

  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) {
      setError("Elegí la marca.");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      setError("Cargá al menos un producto.");
      return;
    }

    const orderFields = {
      business_unit_id: businessUnitId,
      order_date: orderDate,
      brand_id: brandId,
      traveler: traveler.trim() || null,
      // Solo se manda si se completó: así no rompe para quien todavía
      // no corrió la migración 0053 (agrega la columna traveler_phone).
      ...(travelerPhone.trim() ? { traveler_phone: travelerPhone.trim() } : {}),
      payment_type: paymentType.trim() || null,
      arrival_date: arrivalDate || null,
      notes: null,
    };
    const itemsPayload = validLines.map((l) => ({
      product_id: l.productId,
      product_description: l.description.trim(),
      quantity: Number(l.quantity) || 0,
      amount: Number(l.amount) || 0,
    }));

    setSaving(true);
    setError(null);
    const result = editOrder
      ? await updatePurchaseOrderFull(editOrder.id, orderFields, itemsPayload)
      : await createPurchaseOrder({ ...orderFields, items: itemsPayload });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    const { order, items } = result.data as { order: PurchaseOrder; items: PurchaseOrderItem[] };
    onSaved(order, items);
  }

  return (
    <Modal title={isEditing ? "Editar pedido" : "Nuevo pedido"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha de pedido</label>
            <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Marca</label>
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">Elegir marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Viajante</label>
            <Input value={traveler} onChange={(e) => setTraveler(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Teléfono del vendedor (opcional)</label>
            <Input
              type="tel"
              placeholder="Ej: 291 415-2345"
              value={travelerPhone}
              onChange={(e) => setTravelerPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipo de pago</label>
            <input
              list="compras-payment-types"
              className={inputClass}
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            />
            <datalist id="compras-payment-types">
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Fecha de llegada estimada (opcional)</label>
            <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Productos</label>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-xs font-semibold text-mh-pink hover:text-mh-pink-dark"
            >
              <Plus size={14} />
              Agregar línea
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line) => {
              const needle = line.description.trim().toLowerCase();
              // Busca en todos los productos (nunca se queda "mudo"
              // si la marca elegida todavía no tiene productos
              // cargados en Inventario); los de la misma marca
              // aparecen primero para que un pedido típico (una sola
              // marca) tenga menos ruido.
              const matches = needle
                ? products
                    .filter(
                      (p) =>
                        p.sku.toLowerCase().includes(needle) ||
                        p.description.toLowerCase().includes(needle)
                    )
                    .sort((a, b) => {
                      const aPriority = a.brand_id === brandId ? 0 : 1;
                      const bPriority = b.brand_id === brandId ? 0 : 1;
                      return aPriority - bPriority;
                    })
                    .slice(0, 8)
                : [];

              return (
                <div key={line.key} className="rounded-xl border border-mh-border p-2.5">
                  <div className="relative">
                    <input
                      className={inputClass}
                      placeholder="Buscar producto por código o descripción..."
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.key, {
                          description: e.target.value,
                          productId: null,
                          showDropdown: true,
                        })
                      }
                      onFocus={() => updateLine(line.key, { showDropdown: true })}
                      onBlur={() =>
                        setTimeout(() => updateLine(line.key, { showDropdown: false }), 150)
                      }
                    />
                    {line.showDropdown && matches.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-mh-border bg-white py-1 shadow-lg">
                        {matches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pickProduct(line.key, p)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="min-w-0 truncate text-mh-ink">
                              <span className="text-mh-ink-muted">{p.sku}</span> {p.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cantidad"
                      className={`${inputClass} w-28`}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Monto"
                      className={inputClass}
                      value={line.amount}
                      onChange={(e) => updateLine(line.key, { amount: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length === 1}
                      className="shrink-0 rounded-lg p-2 text-mh-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {total > 0 && (
          <p className="rounded-xl bg-mh-bg px-3 py-2 text-sm text-mh-ink-muted">
            Total del pedido: <span className="font-bold text-mh-ink">{formatCurrency(total)}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-mh-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
