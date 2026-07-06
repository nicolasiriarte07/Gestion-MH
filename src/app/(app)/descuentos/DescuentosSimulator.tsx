"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";

const COMISION_TIENDANUBE_PCT = 1;
const IIBB_PCT = 3;

const FINANCIAL_COST_OPTIONS = [
  { key: "mp_debito", label: "MP débito", pct: 4.3 },
  { key: "mp_2_cuotas", label: "MP 2 cuotas", pct: 15.78 },
  { key: "mp_3_cuotas", label: "MP 3 cuotas", pct: 18.7 },
  { key: "go_cuotas", label: "GO Cuotas", pct: 9.9 },
  { key: "transferencia", label: "Transferencia", pct: 10 },
] as const;

const PRODUCTS_PER_PAGE = 20;

function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function netProfitFor(
  priceWeb: number,
  cost: number,
  discountPct: number,
  financialPct: number
): number {
  const discountedPrice = priceWeb * (1 - discountPct / 100);
  const tn = (discountedPrice * COMISION_TIENDANUBE_PCT) / 100;
  const iibb = (discountedPrice * IIBB_PCT) / 100;
  const financial = (discountedPrice * financialPct) / 100;
  return discountedPrice - cost - tn - iibb - financial;
}

export default function DescuentosSimulator({
  products,
}: {
  products: Product[];
}) {
  const [discountPct, setDiscountPct] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Descuento a aplicar (%)
          </span>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
            className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Buscar producto
          </span>
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <p className="text-sm text-slate-500">
          {filtered.length} producto(s) con Costo cargado
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-2 font-medium">Producto</th>
              <th className="px-4 py-2 text-right font-medium">Costo</th>
              <th className="px-4 py-2 text-right font-medium">P. Web</th>
              {FINANCIAL_COST_OPTIONS.map((option) => (
                <th key={option.key} className="px-4 py-2 text-right font-medium">
                  {option.label} ({formatPct(option.pct)})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((product) => (
              <tr key={product.id} className="border-b border-slate-100">
                <td className="px-4 py-2">
                  <p className="font-medium text-slate-900">
                    {product.description}
                  </p>
                  <p className="text-xs text-slate-400">{product.sku}</p>
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatCurrency(product.cost)}
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatCurrency(product.price_web)}
                </td>
                {FINANCIAL_COST_OPTIONS.map((option) => {
                  const netProfit = netProfitFor(
                    product.price_web,
                    product.cost,
                    discountPct,
                    option.pct
                  );
                  return (
                    <td
                      key={option.key}
                      className={`px-4 py-2 text-right font-semibold ${
                        netProfit >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(netProfit)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pagedProducts.length === 0 && (
              <tr>
                <td
                  colSpan={3 + FINANCIAL_COST_OPTIONS.length}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
            <span>
              Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
              {Math.min(currentPage * PRODUCTS_PER_PAGE, filtered.length)} de{" "}
              {filtered.length} producto(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
