"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Package, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { PurchaseOrder } from "@/lib/types";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import {
  ARRIVAL_LIGHT_DOT_CLASSES,
  arrivalLight,
  daysBetweenISO,
  formatDateDMY,
  todayISO,
} from "./purchaseOrderStages";
import {
  PAYMENT_STATUS_LABELS,
  paymentBalance,
  paymentStatus,
  PAYMENT_STATUS_TONE_CLASSES,
  paymentTypeToneClass,
} from "./paymentHelpers";
import { brandAvatarClass, brandInitial } from "./brandColor";
import { deletePurchaseOrder, updatePurchaseOrder } from "./actions";

const dateFieldClass =
  "w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs hover:border-mh-border focus:border-mh-pink focus:bg-white focus:outline-none";

export default function PurchaseOrderCard({
  order,
  brandName,
  onDeleted,
  onEdit,
  onUpdated,
}: {
  order: PurchaseOrderRow;
  brandName: (id: string | null) => string;
  onDeleted: (orderId: string) => void;
  onEdit: (order: PurchaseOrderRow) => void;
  onUpdated: (order: PurchaseOrder) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const today = todayISO();
  const light = arrivalLight(order, today);
  const name = brandName(order.brand_id);
  const status = paymentStatus(order.totalAmount, order.amount_paid);
  const balance = paymentBalance(order.totalAmount, order.amount_paid);
  const daysSinceOrder = daysBetweenISO(order.order_date, today);

  async function handleArrivalDateChange(value: string) {
    setSaving(true);
    const result = await updatePurchaseOrder(order.id, { arrival_date: value || null });
    setSaving(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    onUpdated(result.data as PurchaseOrder);
  }

  async function handleToggleStockLoaded() {
    setSaving(true);
    const result = await updatePurchaseOrder(order.id, { stock_loaded: !order.stock_loaded });
    setSaving(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    onUpdated(result.data as PurchaseOrder);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el pedido a "${name}" del ${order.order_date}?`)) return;
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
    <div className="space-y-2 rounded-xl border border-mh-border bg-mh-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", order.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className="flex cursor-grab items-start justify-between gap-2 active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${brandAvatarClass(name)}`}
          >
            {brandInitial(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-mh-ink">{name}</p>
            <p className="truncate text-xs text-mh-ink-muted">
              Pedido {formatDateDMY(order.order_date)} · {daysSinceOrder}d
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onEdit(order)}
            title="Editar pedido"
            className="rounded-lg p-1 text-mh-ink-muted hover:bg-mh-bg hover:text-mh-ink"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar pedido"
            className="rounded-lg p-1 text-mh-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {order.payment_type && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${paymentTypeToneClass(order.payment_type)}`}
          >
            {order.payment_type}
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${PAYMENT_STATUS_TONE_CLASSES[status]}`}
        >
          {PAYMENT_STATUS_LABELS[status]}
          {status === "parcial" && ` · saldo ${formatCurrency(balance)}`}
        </span>
      </div>

      {order.items.length > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-start gap-1 text-left text-xs text-mh-ink-muted hover:text-mh-ink"
        >
          <Package size={12} className="mt-0.5 shrink-0" />
          {expanded ? (
            <span className="min-w-0 flex-1 space-y-0.5">
              {order.items.map((i) => (
                <span key={i.id} className="block truncate">
                  {i.product_description} × {i.quantity}
                </span>
              ))}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate">
              {firstItem.product_description}
              {extraCount > 0 ? ` y ${extraCount} más` : ""}
            </span>
          )}
          <ChevronDown
            size={13}
            className={`mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <p className="text-xs text-mh-ink-muted italic">Sin productos cargados</p>
      )}

      {order.totalAmount > 0 && (
        <p className="text-right text-xs font-bold text-mh-ink">{formatCurrency(order.totalAmount)}</p>
      )}

      {(order.traveler || order.traveler_phone) && (
        <div className="flex items-center justify-between gap-2 border-t border-mh-border/70 pt-2 text-xs text-mh-ink-muted">
          <span className="truncate">{order.traveler || "Vendedor sin nombre"}</span>
          {order.traveler_phone && (
            <a
              href={buildWhatsAppLink(order.traveler_phone)}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="shrink-0 rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
            >
              <MessageCircle size={13} />
            </a>
          )}
        </div>
      )}

      <div className="border-t border-mh-border/70 pt-2">
        <div className="flex items-center gap-1.5">
          {light && (
            <span
              title={light === "rojo" ? "Atrasado" : light === "amarillo" ? "Llega pronto" : "En término"}
              className={`h-2 w-2 shrink-0 rounded-full ${ARRIVAL_LIGHT_DOT_CLASSES[light]}`}
            />
          )}
          <label className="block text-[10px] font-semibold text-mh-ink-muted uppercase">
            Fecha de llegada
          </label>
        </div>
        <input
          type="date"
          value={order.arrival_date ?? ""}
          disabled={saving}
          onChange={(e) => handleArrivalDateChange(e.target.value)}
          className={`${dateFieldClass} ${light === "rojo" ? "bg-red-50 font-semibold text-red-600" : ""}`}
        />
        {light === "rojo" && (
          <p className="mt-0.5 text-[11px] font-semibold text-red-600">
            Atrasado · {formatDateDMY(order.arrival_date)}
          </p>
        )}
      </div>

      {order.estado === "recibido" && (
        <button
          onClick={handleToggleStockLoaded}
          disabled={saving}
          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${
            order.stock_loaded
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {order.stock_loaded ? "Stock cargado ✓" : "Cargar stock en Inventario"}
        </button>
      )}
    </div>
  );
}
