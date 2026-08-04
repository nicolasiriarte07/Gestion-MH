"use client";

import { useState } from "react";
import { Package, Clock } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/lib/types";
import { stockTone, stockLabel } from "./stockStatus";

type Tab = "resumen" | "historial" | "movimientos";

const TABS: { key: Tab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "historial", label: "Historial" },
  { key: "movimientos", label: "Movimientos" },
];

export default function InventarioDrawer({
  product,
  categoryName,
  brandName,
  onClose,
  onEdit,
  onAdjustStock,
}: {
  product: Product | null;
  categoryName: (id: string | null) => string;
  brandName: (id: string | null) => string;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
}) {
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <Drawer open={product !== null} onClose={onClose}>
      {product && (
        <>
          <div className="flex items-start gap-4 border-b border-mh-border p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-mh-bg text-mh-ink-muted">
              <Package size={26} />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <p className="truncate text-lg font-extrabold text-mh-ink">
                {product.description}
              </p>
              <p className="text-sm text-mh-ink-muted">{product.sku}</p>
              <div className="mt-2">
                <Badge tone={stockTone(product.stock)}>
                  {stockLabel(product.stock)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex border-b border-mh-border px-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-3 py-3 text-sm font-semibold ${
                  tab === t.key
                    ? "border-mh-pink text-mh-pink"
                    : "border-transparent text-mh-ink-muted hover:text-mh-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            {tab === "resumen" && <ResumenTab product={product} categoryName={categoryName} brandName={brandName} />}
            {tab === "historial" && <EmptyTab text="Todavía no hay un historial de cambios registrado para este producto." />}
            {tab === "movimientos" && <EmptyTab text="Todavía no hay movimientos de stock (entradas/salidas/ajustes) registrados." />}
          </div>

          <div className="space-y-2 border-t border-mh-border p-6">
            <button
              onClick={() => onEdit(product)}
              className="w-full rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
            >
              Editar producto
            </button>
            <button
              onClick={() => onAdjustStock(product)}
              className="w-full rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
            >
              Ajustar stock
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}

function ResumenTab({
  product,
  categoryName,
  brandName,
}: {
  product: Product;
  categoryName: (id: string | null) => string;
  brandName: (id: string | null) => string;
}) {
  const margin =
    product.price_cash > 0
      ? ((product.price_cash - product.cost) / product.price_cash) * 100
      : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Stock actual" value={String(product.stock)} big />
        <Field label="Costo" value={formatCurrency(product.cost)} big />
        <Field label="P. Contado" value={formatCurrency(product.price_cash)} big />
        <Field label="P. Web" value={formatCurrency(product.price_web)} big />
        <Field label="Margen" value={margin === null ? "—" : `${margin.toFixed(0)}%`} big />
        <Field label="Publicado" value={product.is_web ? "Sí" : "No"} big />
      </div>

      <div className="space-y-3 border-t border-mh-border pt-4">
        <Field label="Marca" value={brandName(product.brand_id) || "Sin marca"} />
        <Field label="Categoría" value={categoryName(product.category_id) || "Sin categoría"} />
        <Field label="Proveedor" value="—" />
        <Field label="Ubicación" value="—" />
        <Field label="Código de barras" value="—" />
      </div>
    </div>
  );
}

function Field({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mh-ink-muted">{label}</p>
      <p className={big ? "text-lg font-bold text-mh-ink" : "text-sm font-medium text-mh-ink"}>
        {value}
      </p>
    </div>
  );
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Clock size={28} className="text-slate-300" />
      <p className="max-w-[26ch] text-sm text-mh-ink-muted">{text}</p>
    </div>
  );
}
