"use client";

import { Search, X } from "lucide-react";
import type { Brand } from "@/lib/types";

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function PurchaseOrdersFilterBar({
  search,
  onSearchChange,
  brandId,
  onBrandChange,
  brands,
  paymentType,
  onPaymentTypeChange,
  paymentTypes,
  onlyLate,
  onOnlyLateChange,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  brandId: string;
  onBrandChange: (v: string) => void;
  brands: Brand[];
  paymentType: string;
  onPaymentTypeChange: (v: string) => void;
  paymentTypes: string[];
  onlyLate: boolean;
  onOnlyLateChange: (v: boolean) => void;
  onClear: () => void;
}) {
  const hasFilters = search !== "" || brandId !== "" || paymentType !== "" || onlyLate;

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar por producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select value={brandId} onChange={(e) => onBrandChange(e.target.value)} className={selectClass}>
        <option value="">Proveedor: todos</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={paymentType}
        onChange={(e) => onPaymentTypeChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Condición de pago: todas</option>
        {paymentTypes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm font-semibold text-mh-ink">
        <input
          type="checkbox"
          className="accent-mh-pink"
          checked={onlyLate}
          onChange={(e) => onOnlyLateChange(e.target.checked)}
        />
        Solo atrasados
      </label>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
