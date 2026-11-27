import type { PurchaseOrder, PurchaseOrderEstado, PurchaseOrderItem, PurchaseOrderStageEvent } from "@/lib/types";

export type PurchaseOrderRow = PurchaseOrder & {
  items: PurchaseOrderItem[];
  totalAmount: number;
  totalQuantity: number;
  // Fecha en que pasó a "Recibido": la más reciente del historial de
  // etapas; si el pedido está recién marcado como recibido y ese
  // cambio todavía no llegó al historial (acción optimista en el
  // cliente), se asume "hoy" en lugar de dejarlo afuera del filtro de
  // últimos 30 días.
  receivedAt: string | null;
};

export function deriveReceivedAt(
  orderId: string,
  estado: PurchaseOrderEstado,
  stageEvents: PurchaseOrderStageEvent[],
  today: string
): string | null {
  if (estado !== "recibido") return null;
  const receivedEvents = stageEvents.filter(
    (e) => e.purchase_order_id === orderId && e.estado === "recibido"
  );
  if (receivedEvents.length === 0) return today;
  return receivedEvents.reduce(
    (latest, e) => (e.changed_at > latest ? e.changed_at : latest),
    receivedEvents[0].changed_at
  );
}

export function buildPurchaseOrderRows(
  orders: PurchaseOrder[],
  itemsByOrder: Map<string, PurchaseOrderItem[]>,
  stageEvents: PurchaseOrderStageEvent[],
  today: string
): PurchaseOrderRow[] {
  return orders.map((order) => {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    return {
      ...order,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, i) => sum + i.amount, 0),
      totalQuantity: orderItems.reduce((sum, i) => sum + i.quantity, 0),
      receivedAt: deriveReceivedAt(order.id, order.estado, stageEvents, today),
    };
  });
}
