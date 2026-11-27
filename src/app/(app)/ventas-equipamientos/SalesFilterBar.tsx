"use client";

import { Search, X } from "lucide-react";
import { SALE_PAYMENT_METHODS, type SalePaymentMethod } from "@/lib/types";
import Input from "@/components/ds/Input";
import Select from "@/components/ds/Select";
import Button from "@/components/ds/Button";

export type EstadoFilter = "" | "cobrado" | "pendiente";

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
      <div className="min-w-[240px] flex-1">
        <Input
          icon={<Search size={16} />}
          type="text"
          placeholder="Buscar por cliente, comercio o producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="w-44">
        <Select
          value={metodo}
          onChange={(e) => onMetodoChange(e.target.value as SalePaymentMethod | "")}
        >
          <option value="">Método: todos</option>
          {SALE_PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-52">
        <Select value={estado} onChange={(e) => onEstadoChange(e.target.value as EstadoFilter)}>
          <option value="">Estado: todos</option>
          <option value="cobrado">Cobrado</option>
          <option value="pendiente">Pendiente de cobro</option>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" icon={<X size={14} />} onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
