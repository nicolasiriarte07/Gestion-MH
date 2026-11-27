"use client";

import { useState } from "react";
import type { PurchaseOrder, PurchaseOrderEstado } from "@/lib/types";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { COLUMN_HEADER_CLASSES, STAGE_LABELS, todayISO } from "./purchaseOrderStages";
import { updatePurchaseOrder } from "./actions";
import PurchaseOrderCard from "./PurchaseOrderCard";

const KANBAN_STAGES: PurchaseOrderEstado[] = ["pedido", "confirmado", "en_camino", "recibido"];

// Drag & drop nativo (misma técnica que el Kanban de Leads): cada
// PurchaseOrderCard es "draggable" y pone su id en dataTransfer; cada
// columna acepta el drop y actualiza el estado. Al soltar en
// "Recibido" sin fecha de llegada cargada, se completa con la de hoy.
export default function PurchaseOrdersKanban({
  orders,
  brandName,
  onDeleted,
  onEdit,
  onUpdated,
}: {
  orders: PurchaseOrderRow[];
  brandName: (id: string | null) => string;
  onDeleted: (orderId: string) => void;
  onEdit: (order: PurchaseOrderRow) => void;
  onUpdated: (order: PurchaseOrder) => void;
}) {
  const [dragOverStage, setDragOverStage] = useState<PurchaseOrderEstado | null>(null);

  function ordersByStage(stage: PurchaseOrderEstado): PurchaseOrderRow[] {
    return orders
      .filter((o) => o.estado === stage)
      .sort((a, b) => (b.order_date ?? "").localeCompare(a.order_date ?? ""));
  }

  async function handleDrop(e: React.DragEvent, stage: PurchaseOrderEstado) {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain");
    const order = orders.find((o) => o.id === id);
    if (!order || order.estado === stage) return;

    const patch: Partial<Pick<PurchaseOrderRow, "estado" | "arrival_date">> = { estado: stage };
    if (stage === "recibido" && !order.arrival_date) {
      patch.arrival_date = todayISO();
    }

    const result = await updatePurchaseOrder(id, patch);
    if (result.error) {
      alert(result.error);
      return;
    }
    onUpdated(result.data as PurchaseOrder);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_STAGES.map((stage) => {
        const stageOrders = ordersByStage(stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => handleDrop(e, stage)}
            className={`flex flex-col gap-3 rounded-2xl border p-3 transition-colors ${
              dragOverStage === stage
                ? "border-mh-pink bg-mh-pink-light/30"
                : "border-mh-border bg-mh-bg"
            }`}
          >
            <div
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${COLUMN_HEADER_CLASSES[stage]}`}
            >
              <span>{STAGE_LABELS[stage]}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
                {stageOrders.length}
              </span>
            </div>
            <div className="min-h-[80px] space-y-2">
              {stageOrders.map((order) => (
                <PurchaseOrderCard
                  key={order.id}
                  order={order}
                  brandName={brandName}
                  onDeleted={onDeleted}
                  onEdit={onEdit}
                  onUpdated={onUpdated}
                />
              ))}
              {stageOrders.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-mh-ink-muted">
                  Sin pedidos en esta etapa.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
