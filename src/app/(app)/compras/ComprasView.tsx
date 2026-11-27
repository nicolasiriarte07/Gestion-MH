"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type {
  Brand,
  BusinessUnit,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStageEvent,
} from "@/lib/types";
import { buildPurchaseOrderRows, type PurchaseOrderRow } from "./purchaseOrderRow";
import { todayISO } from "./purchaseOrderStages";
import BusinessUnitSwitch from "./BusinessUnitSwitch";
import PurchaseOrdersKanban from "./PurchaseOrdersKanban";
import NewPurchaseOrderModal from "./NewPurchaseOrderModal";

export default function ComprasView({
  businessUnits,
  brands,
  products,
  initialOrders,
  initialItems,
  initialStageEvents,
}: {
  businessUnits: BusinessUnit[];
  brands: Brand[];
  products: Product[];
  initialOrders: PurchaseOrder[];
  initialItems: PurchaseOrderItem[];
  initialStageEvents: PurchaseOrderStageEvent[];
}) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialItems);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(businessUnits[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrderRow | null>(null);

  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [b.id, b.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Sin marca") : "Sin marca");
  }, [brands]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => o.business_unit_id === activeUnitId),
    [orders, activeUnitId]
  );

  const itemsByOrder = useMemo(() => {
    const map = new Map<string, PurchaseOrderItem[]>();
    for (const item of items) {
      const list = map.get(item.purchase_order_id) ?? [];
      list.push(item);
      map.set(item.purchase_order_id, list);
    }
    return map;
  }, [items]);

  const today = todayISO();
  const kanbanRows = useMemo(
    () => buildPurchaseOrderRows(filteredOrders, itemsByOrder, initialStageEvents, today),
    [filteredOrders, itemsByOrder, initialStageEvents, today]
  );

  const activeProducts = useMemo(
    () => products.filter((p) => p.business_unit_id === activeUnitId),
    [products, activeUnitId]
  );

  function handleSaved(order: PurchaseOrder, newItems: PurchaseOrderItem[]) {
    setOrders((prev) =>
      prev.some((o) => o.id === order.id)
        ? prev.map((o) => (o.id === order.id ? order : o))
        : [order, ...prev]
    );
    setItems((prev) => [...prev.filter((i) => i.purchase_order_id !== order.id), ...newItems]);
    setCreating(false);
    setEditingOrder(null);
  }

  function handleUpdated(updated: PurchaseOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function handleDeleted(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setItems((prev) => prev.filter((i) => i.purchase_order_id !== orderId));
  }

  if (businessUnits.length === 0 || !activeUnitId) {
    return (
      <p className="font-inter rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
        No encontré las unidades de negocio &quot;Mundo Hogar&quot; / &quot;Equipamientos MH&quot;.
        Revisá la tabla business_units.
      </p>
    );
  }

  return (
    <div className="font-inter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-mh-ink">Compras</h1>
          <p className="text-sm text-mh-ink-muted">Pedidos a marcas y proveedores.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Nuevo pedido
        </button>
      </div>

      <div className="flex justify-center">
        <BusinessUnitSwitch
          businessUnits={businessUnits}
          activeId={activeUnitId}
          onSelect={setActiveUnitId}
        />
      </div>

      <PurchaseOrdersKanban
        orders={kanbanRows}
        brandName={brandName}
        onDeleted={handleDeleted}
        onEdit={setEditingOrder}
        onUpdated={handleUpdated}
      />

      {(creating || editingOrder) && (
        <NewPurchaseOrderModal
          businessUnitId={activeUnitId}
          brands={brands}
          products={activeProducts}
          editOrder={editingOrder}
          onClose={() => {
            setCreating(false);
            setEditingOrder(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
