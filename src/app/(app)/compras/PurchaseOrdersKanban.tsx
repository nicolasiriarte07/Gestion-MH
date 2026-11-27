"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { PurchaseOrder, PurchaseOrderEstado } from "@/lib/types";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { COLUMN_HEADER_CLASSES, STAGE_LABELS, daysBetweenISO, todayISO } from "./purchaseOrderStages";
import { updatePurchaseOrder } from "./actions";
import PurchaseOrderCard from "./PurchaseOrderCard";

const KANBAN_STAGES: PurchaseOrderEstado[] = ["pedido", "confirmado", "en_camino", "recibido"];
const RECIBIDO_HISTORIAL_DIAS = 30;

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
  const [showAllReceived, setShowAllReceived] = useState(false);
  const today = todayISO();

  function ordersByStage(stage: PurchaseOrderEstado): PurchaseOrderRow[] {
    const stageOrders = orders
      .filter((o) => o.estado === stage)
      .sort((a, b) => (b.order_date ?? "").localeCompare(a.order_date ?? ""));

    if (stage !== "recibido" || showAllReceived) return stageOrders;

    return stageOrders.filter(
      (o) => !o.receivedAt || daysBetweenISO(o.receivedAt, today) <= RECIBIDO_HISTORIAL_DIAS
    );
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

  const totalReceivedCount = orders.filter((o) => o.estado === "recibido").length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_STAGES.map((stage) => {
        const stageOrders = ordersByStage(stage);
        const columnTotal = stageOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const hiddenReceived =
          stage === "recibido" && !showAllReceived ? totalReceivedCount - stageOrders.length : 0;
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
              className={`flex flex-col gap-1 rounded-xl px-3 py-2 text-sm font-bold ${COLUMN_HEADER_CLASSES[stage]}`}
            >
              <div className="flex items-center justify-between">
                <span>{STAGE_LABELS[stage]}</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
                  {stageOrders.length}
                </span>
              </div>
              {columnTotal > 0 && (
                <span className="tabular-nums-mh text-xs font-semibold opacity-80">
                  {formatCurrency(columnTotal)}
                </span>
              )}
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
              {stage === "recibido" && hiddenReceived > 0 && (
                <button
                  onClick={() => setShowAllReceived(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-mh-border py-2 text-xs font-semibold text-mh-ink-muted hover:border-mh-pink hover:text-mh-pink"
                >
                  <History size={13} />
                  Ver historial ({hiddenReceived} más)
                </button>
              )}
              {stage === "recibido" && showAllReceived && totalReceivedCount > 0 && (
                <button
                  onClick={() => setShowAllReceived(false)}
                  className="w-full rounded-xl py-1.5 text-center text-xs font-semibold text-mh-ink-muted hover:text-mh-pink"
                >
                  Mostrar solo últimos {RECIBIDO_HISTORIAL_DIAS} días
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
