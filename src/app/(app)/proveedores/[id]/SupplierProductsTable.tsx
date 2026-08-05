"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import Modal from "@/components/Modal";
import Card from "@/components/ds/Card";
import { addSupplierProduct, removeSupplierProduct } from "../actions";

export type SupplierProductRow = {
  id: string;
  product_id: string;
  sku: string;
  description: string;
  categoryName: string;
  brandName: string;
  supplier_cost: number | null;
  price_web: number;
  stock: number;
  last_purchase_date: string | null;
};

function marginPct(cost: number | null, priceWeb: number): string {
  if (!cost || priceWeb <= 0) return "—";
  return `${(((priceWeb - cost) / priceWeb) * 100).toFixed(0)}%`;
}

export default function SupplierProductsTable({
  supplierId,
  rows,
  availableProducts,
}: {
  supplierId: string;
  rows: SupplierProductRow[];
  availableProducts: Product[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return availableProducts.slice(0, 30);
    return availableProducts
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      )
      .slice(0, 30);
  }, [availableProducts, search]);

  async function handleAdd(productId: string) {
    setAdding(productId);
    const result = await addSupplierProduct({
      supplier_id: supplierId,
      product_id: productId,
      supplier_cost: null,
    });
    setAdding(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    setShowModal(false);
    setSearch("");
    router.refresh();
  }

  async function handleRemove(row: SupplierProductRow) {
    if (!confirm(`¿Quitar "${row.description}" de este proveedor?`)) return;

    setRemovingId(row.id);
    const result = await removeSupplierProduct(row.id, supplierId);
    setRemovingId(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="font-inter space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Agregar producto existente
        </button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                <th className="px-4 py-3">Imagen</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Marca</th>
                <th className="px-3 py-3">Costo actual</th>
                <th className="px-3 py-3">Precio venta</th>
                <th className="px-3 py-3">Margen</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Última compra</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-mh-border/70 last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mh-bg text-mh-ink-muted">
                      <Package size={16} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">{row.sku}</td>
                  <td className="px-3 py-3 font-bold text-mh-ink">
                    {row.description}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">{row.categoryName}</td>
                  <td className="px-3 py-3 text-mh-ink-muted">{row.brandName}</td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.supplier_cost !== null
                      ? formatCurrency(row.supplier_cost)
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {formatCurrency(row.price_web)}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {marginPct(row.supplier_cost, row.price_web)}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">{row.stock}</td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.last_purchase_date ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleRemove(row)}
                      disabled={removingId === row.id}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-mh-ink-muted">
                    Todavía no hay productos asociados a este proveedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal title="Agregar producto existente" onClose={() => setShowModal(false)}>
          <input
            autoFocus
            type="text"
            placeholder="Buscar por código o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-inter mb-3 w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                disabled={adding === p.id}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="min-w-0 truncate text-mh-ink">
                  <span className="text-mh-ink-muted">{p.sku}</span> {p.description}
                </span>
                <span className="shrink-0 text-xs text-mh-ink-muted">
                  {formatCurrency(p.price_web)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-mh-ink-muted">
                No se encontraron productos.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
