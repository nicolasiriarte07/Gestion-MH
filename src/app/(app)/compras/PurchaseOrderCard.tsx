"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { formatDateDMY, todayISO } from "./purchaseOrderStages";
import { deletePurchaseOrder, updatePurchaseOrder } from "./actions";

const dateFieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs hover:border-mh-border focus:border-mh-pink focus:bg-white focus:outline-none";

export default function PurchaseOrderCard({
  order,
  brandName,
  onDeleted,
}: {
  order: PurchaseOrderRow;
  brandName: (id: string | null) => string;
  onDeleted: (orderId: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const overdueArrival =
    !!order.arrival_date && order.arrival_date < todayISO() && order.estado !== "recibido";

  async function handleArrivalDateChange(value: string) {
    setSaving(true);
    const result = await updatePurchaseOrder(order.id, { arrival_date: value || null });
    setSaving(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el pedido a "${brandName(order.brand_id)}" del ${order.order_date}?`))
      return;
    setDeleting(true);
    const result = await deletePurchaseOrder(order.id);
    setDeleting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    onDeleted(order.id);
  }

  const firstItem = order.items[0];
  const extraCount = order.items.length - 1;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", order.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab space-y-2 rounded-xl border border-mh-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-mh-ink">{brandName(order.brand_id)}</p>
          <p className="truncate text-xs text-mh-ink-muted">
            {[order.traveler, order.payment_type].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar pedido"
          className="shrink-0 rounded-lg p-1 text-mh-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {order.items.length > 0 ? (
        <p className="truncate text-xs text-mh-ink-muted">
          {firstItem.product_description}
          {extraCount > 0 ? ` y ${extraCount} más` : ""}
        </p>
      ) : (
        <p className="text-xs text-mh-ink-muted italic">Sin productos cargados</p>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-mh-ink-muted">Pedido {formatDateDMY(order.order_date)}</span>
        {order.totalAmount > 0 && (
          <span className="font-bold text-mh-ink">{formatCurrency(order.totalAmount)}</span>
        )}
      </div>

      <div className="border-t border-mh-border/70 pt-2">
        <label className="mb-0.5 block text-[10px] font-semibold text-mh-ink-muted uppercase">
          Fecha de llegada
        </label>
        <input
          type="date"
          value={order.arrival_date ?? ""}
          disabled={saving}
          onChange={(e) => handleArrivalDateChange(e.target.value)}
          className={`${dateFieldClass} ${overdueArrival ? "bg-red-50 font-semibold text-red-600" : ""}`}
        />
        {overdueArrival && (
          <p className="mt-0.5 text-[11px] font-semibold text-red-600">
            Atrasado · {formatDateDMY(order.arrival_date)}
          </p>
        )}
      </div>
    </div>
  );
}
