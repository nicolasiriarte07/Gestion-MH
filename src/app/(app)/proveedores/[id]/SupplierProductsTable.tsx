"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import Modal from "@/components/Modal";
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Agregar producto existente
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Imagen</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Marca</th>
              <th className="px-3 py-2 font-medium">Costo actual</th>
              <th className="px-3 py-2 font-medium">Precio venta</th>
              <th className="px-3 py-2 font-medium">Margen</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Última compra</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-300">
                    <Package size={16} />
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-600">{row.sku}</td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {row.description}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.categoryName}</td>
                <td className="px-3 py-2 text-slate-600">{row.brandName}</td>
                <td className="px-3 py-2 text-slate-600">
                  {row.supplier_cost !== null
                    ? formatCurrency(row.supplier_cost)
                    : "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {formatCurrency(row.price_web)}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {marginPct(row.supplier_cost, row.price_web)}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.stock}</td>
                <td className="px-3 py-2 text-slate-600">
                  {row.last_purchase_date ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleRemove(row)}
                    disabled={removingId === row.id}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                  Todavía no hay productos asociados a este proveedor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Agregar producto existente" onClose={() => setShowModal(false)}>
          <input
            autoFocus
            type="text"
            placeholder="Buscar por código o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                disabled={adding === p.id}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="min-w-0 truncate">
                  <span className="text-slate-400">{p.sku}</span> {p.description}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatCurrency(p.price_web)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-slate-400">
                No se encontraron productos.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
