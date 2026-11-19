"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types";
import { deletePurchaseOrder, toggleOrderConfirmed } from "./actions";

// Misma idea que la tabla que ya usaba el usuario a mano: una fila por
// producto, con Fecha/Marca/Viajante/Tipo de pago/Confirmado fusionados
// (rowSpan) en la primera fila de cada pedido.
export default function PurchaseOrdersTable({
  orders,
  itemsByOrder,
  brandName,
  onToggled,
  onDeleted,
}: {
  orders: PurchaseOrder[];
  itemsByOrder: Map<string, PurchaseOrderItem[]>;
  brandName: (id: string | null) => string;
  onToggled: (order: PurchaseOrder) => void;
  onDeleted: (orderId: string) => void;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleToggle(order: PurchaseOrder) {
    setTogglingId(order.id);
    const result = await toggleOrderConfirmed(order.id, !order.confirmed);
    setTogglingId(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    onToggled(result.data as PurchaseOrder);
  }

  async function handleDelete(order: PurchaseOrder) {
    if (
      !confirm(`¿Eliminar el pedido a "${brandName(order.brand_id)}" del ${order.order_date}?`)
    )
      return;
    setDeletingId(order.id);
    const result = await deletePurchaseOrder(order.id);
    setDeletingId(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    onDeleted(order.id);
  }

  return (
    <Card padding="none" className="font-inter overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-3 py-3">Fecha pedido</th>
              <th className="px-3 py-3">Marca</th>
              <th className="px-3 py-3">Viajante</th>
              <th className="px-3 py-3">Tipo pago</th>
              <th className="px-3 py-3">Productos</th>
              <th className="px-3 py-3">Cantidad</th>
              <th className="px-3 py-3">Monto</th>
              <th className="px-3 py-3 text-center">Confirmado</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const lines = itemsByOrder.get(order.id) ?? [];
              const rowCount = Math.max(lines.length, 1);

              if (lines.length === 0) {
                return (
                  <tr
                    key={order.id}
                    className="border-b border-mh-border/70 last:border-0 hover:bg-mh-bg"
                  >
                    <td className="px-3 py-3 text-mh-ink-muted">{order.order_date}</td>
                    <td className="px-3 py-3 font-semibold text-mh-ink">
                      {brandName(order.brand_id)}
                    </td>
                    <td className="px-3 py-3 text-mh-ink-muted">{order.traveler ?? "—"}</td>
                    <td className="px-3 py-3 text-mh-ink-muted">{order.payment_type ?? "—"}</td>
                    <td className="px-3 py-3 text-mh-ink-muted italic" colSpan={3}>
                      Sin productos cargados
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-mh-pink"
                        checked={order.confirmed}
                        disabled={togglingId === order.id}
                        onChange={() => handleToggle(order)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(order)}
                        disabled={deletingId === order.id}
                        className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              }

              return lines.map((line, idx) => (
                <tr
                  key={line.id}
                  className="border-b border-mh-border/70 last:border-0 hover:bg-mh-bg"
                >
                  {idx === 0 && (
                    <>
                      <td className="px-3 py-3 align-top text-mh-ink-muted" rowSpan={rowCount}>
                        {order.order_date}
                      </td>
                      <td
                        className="px-3 py-3 align-top font-semibold text-mh-ink"
                        rowSpan={rowCount}
                      >
                        {brandName(order.brand_id)}
                      </td>
                      <td className="px-3 py-3 align-top text-mh-ink-muted" rowSpan={rowCount}>
                        {order.traveler ?? "—"}
                      </td>
                      <td className="px-3 py-3 align-top text-mh-ink-muted" rowSpan={rowCount}>
                        {order.payment_type ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-3 text-mh-ink">{line.product_description}</td>
                  <td className="px-3 py-3 text-mh-ink-muted">{line.quantity}</td>
                  <td className="px-3 py-3 font-medium text-mh-ink">
                    {formatCurrency(line.amount)}
                  </td>
                  {idx === 0 && (
                    <>
                      <td className="px-3 py-3 text-center align-top" rowSpan={rowCount}>
                        <input
                          type="checkbox"
                          className="accent-mh-pink"
                          checked={order.confirmed}
                          disabled={togglingId === order.id}
                          onChange={() => handleToggle(order)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top" rowSpan={rowCount}>
                        <button
                          onClick={() => handleDelete(order)}
                          disabled={deletingId === order.id}
                          className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ));
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay pedidos cargados para esta unidad de negocio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
