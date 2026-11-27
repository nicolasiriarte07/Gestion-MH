"use client";

import { Search, X } from "lucide-react";
import { CONTACT_CATEGORIES, type ContactCategory } from "@/lib/types";
import Input from "@/components/ds/Input";
import Select from "@/components/ds/Select";
import Button from "@/components/ds/Button";

export default function ContactFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  city,
  onCityChange,
  cities,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: ContactCategory | "";
  onCategoryChange: (v: ContactCategory | "") => void;
  city: string;
  onCityChange: (v: string) => void;
  cities: string[];
  onClear: () => void;
}) {
  const hasFilters = search !== "" || category !== "" || city !== "";

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="min-w-[240px] flex-1">
        <Input
          icon={<Search size={16} />}
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="w-44">
        <Select value={city} onChange={(e) => onCityChange(e.target.value)}>
          <option value="">Ciudad: todas</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-44">
        <Select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ContactCategory | "")}
        >
          <option value="">Rubro: todos</option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
