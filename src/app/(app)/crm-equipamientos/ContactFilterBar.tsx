"use client";

import { Search, X } from "lucide-react";
import { CONTACT_CATEGORIES, type ContactCategory } from "@/lib/types";

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function ContactFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: ContactCategory | "";
  onCategoryChange: (v: ContactCategory | "") => void;
  onClear: () => void;
}) {
  const hasFilters = search !== "" || category !== "";

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[240px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar por nombre, comercio o ciudad..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as ContactCategory | "")}
        className={selectClass}
      >
        <option value="">Rubro: todos</option>
        {CONTACT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
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
