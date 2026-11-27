"use client";

import { Search, X } from "lucide-react";
import type { Brand } from "@/lib/types";
import Input from "@/components/ds/Input";
import Select from "@/components/ds/Select";
import Button from "@/components/ds/Button";

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
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-mh-card border border-mh-border bg-mh-surface p-4 shadow-mh-card">
      <div className="min-w-[220px] flex-1">
        <Input
          icon={<Search size={16} />}
          type="text"
          placeholder="Buscar por producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="w-48">
        <Select value={brandId} onChange={(e) => onBrandChange(e.target.value)}>
          <option value="">Proveedor: todos</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-52">
        <Select value={paymentType} onChange={(e) => onPaymentTypeChange(e.target.value)}>
          <option value="">Condición de pago: todas</option>
          {paymentTypes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

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
        <Button variant="ghost" icon={<X size={14} />} onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
