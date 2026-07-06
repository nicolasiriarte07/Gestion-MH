"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

export default function ProductPicker({
  products,
  selectedProduct,
}: {
  products: Product[];
  selectedProduct: Product | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products.slice(0, 20);
    return products
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      )
      .slice(0, 20);
  }, [products, search]);

  function select(product: Product) {
    setOpen(false);
    setSearch("");
    router.push(`/precios-competencia?product=${product.id}`);
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar producto por código o descripción..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="min-w-0 truncate">
                <span className="text-slate-400">{p.sku}</span> {p.description}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              Sin resultados.
            </p>
          )}
        </div>
      )}
      {selectedProduct && (
        <p className="mt-2 text-sm text-slate-600">
          Producto seleccionado:{" "}
          <span className="font-medium text-slate-900">
            {selectedProduct.description}
          </span>{" "}
          ({selectedProduct.sku})
        </p>
      )}
    </div>
  );
}
