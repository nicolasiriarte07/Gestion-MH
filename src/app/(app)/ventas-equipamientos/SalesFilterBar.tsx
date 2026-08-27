"use client";

import { Search, X } from "lucide-react";
import { SALE_PAYMENT_METHODS, type SalePaymentMethod } from "@/lib/types";

export type EstadoFilter = "" | "cobrado" | "pendiente";

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function SalesFilterBar({
  search,
  onSearchChange,
  metodo,
  onMetodoChange,
  estado,
  onEstadoChange,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  metodo: SalePaymentMethod | "";
  onMetodoChange: (v: SalePaymentMethod | "") => void;
  estado: EstadoFilter;
  onEstadoChange: (v: EstadoFilter) => void;
  onClear: () => void;
}) {
  const hasFilters = search !== "" || metodo !== "" || estado !== "";

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[240px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar por cliente, comercio o producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select
        value={metodo}
        onChange={(e) => onMetodoChange(e.target.value as SalePaymentMethod | "")}
        className={selectClass}
      >
        <option value="">Método: todos</option>
        {SALE_PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={estado}
        onChange={(e) => onEstadoChange(e.target.value as EstadoFilter)}
        className={selectClass}
      >
        <option value="">Estado: todos</option>
        <option value="cobrado">Cobrado</option>
        <option value="pendiente">Pendiente de cobro</option>
      </select>

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
