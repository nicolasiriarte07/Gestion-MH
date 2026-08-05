"use client";

import { Search, X } from "lucide-react";
import type { ClienteStatus } from "./aggregate";
import { clienteStatusLabel } from "./clienteStatus";

export type ClienteSort = "facturacion" | "nombre" | "ultima_compra";

const STATUS_OPTIONS: ClienteStatus[] = ["vip", "frecuente", "nuevo", "activo", "inactivo"];

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function ClienteFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  status: ClienteStatus | "";
  onStatusChange: (v: ClienteStatus | "") => void;
  sort: ClienteSort;
  onSortChange: (v: ClienteSort) => void;
  onClear: () => void;
}) {
  const hasFilters = search !== "" || status !== "" || sort !== "facturacion";

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[240px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ClienteStatus | "")}
        className={selectClass}
      >
        <option value="">Estado: todos</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {clienteStatusLabel(s)}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as ClienteSort)}
        className={selectClass}
      >
        <option value="facturacion">Ordenar: mayor facturación</option>
        <option value="nombre">Ordenar: nombre (A-Z)</option>
        <option value="ultima_compra">Ordenar: última compra</option>
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
