"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type {
  Brand,
  BusinessUnit,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStageEvent,
} from "@/lib/types";
import Button from "@/components/ds/Button";
import SegmentedTabs from "@/components/ds/SegmentedTabs";
import { buildPurchaseOrderRows, type PurchaseOrderRow } from "./purchaseOrderRow";
import { arrivalLight, todayISO } from "./purchaseOrderStages";
import BusinessUnitSwitch from "./BusinessUnitSwitch";
import PurchaseOrdersSummary from "./PurchaseOrdersSummary";
import PurchaseOrdersFilterBar from "./PurchaseOrdersFilterBar";
import PurchaseOrdersKanban from "./PurchaseOrdersKanban";
import PurchaseOrdersListView from "./PurchaseOrdersListView";
import NewPurchaseOrderModal from "./NewPurchaseOrderModal";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.16 } } };

type ViewMode = "kanban" | "lista";

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
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [onlyLate, setOnlyLate] = useState(false);

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
  const allRows = useMemo(
    () => buildPurchaseOrderRows(filteredOrders, itemsByOrder, initialStageEvents, today),
    [filteredOrders, itemsByOrder, initialStageEvents, today]
  );

  const paymentTypes = useMemo(
    () => [...new Set(orders.map((o) => o.payment_type).filter((p): p is string => !!p))].sort(),
    [orders]
  );

  const filteredRows = useMemo(() => {
    let result = allRows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter((o) =>
        o.items.some((i) => i.product_description.toLowerCase().includes(needle))
      );
    }
    if (brandId) result = result.filter((o) => o.brand_id === brandId);
    if (paymentType) result = result.filter((o) => o.payment_type === paymentType);
    if (onlyLate) result = result.filter((o) => arrivalLight(o, today) === "rojo");
    return result;
  }, [allRows, search, brandId, paymentType, onlyLate, today]);

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
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
          Nuevo pedido
        </Button>
      </div>

      <div className="flex justify-center">
        <BusinessUnitSwitch
          businessUnits={businessUnits}
          activeId={activeUnitId}
          onSelect={setActiveUnitId}
        />
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <PurchaseOrdersSummary rows={allRows} today={today} />
        </motion.div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <PurchaseOrdersFilterBar
            search={search}
            onSearchChange={setSearch}
            brandId={brandId}
            onBrandChange={setBrandId}
            brands={brands}
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
            paymentTypes={paymentTypes}
            onlyLate={onlyLate}
            onOnlyLateChange={setOnlyLate}
            onClear={() => {
              setSearch("");
              setBrandId("");
              setPaymentType("");
              setOnlyLate(false);
            }}
          />
        </div>
        <SegmentedTabs
          value={viewMode}
          onChange={setViewMode}
          size="sm"
          options={[
            { value: "kanban", label: "Kanban" },
            { value: "lista", label: "Lista" },
          ]}
        />
      </div>

      {viewMode === "kanban" ? (
        <PurchaseOrdersKanban
          orders={filteredRows}
          brandName={brandName}
          onDeleted={handleDeleted}
          onEdit={setEditingOrder}
          onUpdated={handleUpdated}
        />
      ) : (
        <PurchaseOrdersListView rows={filteredRows} brandName={brandName} />
      )}

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
