"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { BusinessUnit, Category, Brand } from "@/lib/types";

const ESTADO_OPTIONS = [
  { value: "", label: "Estado: todos" },
  { value: "en_stock", label: "En stock" },
  { value: "bajo", label: "Stock bajo" },
  { value: "sin_stock", label: "Sin stock" },
];

// El filtro "Estado" es una traducción amigable de los mismos
// stockMin/stockMax que ya entiende la tabla (no es un campo nuevo en la
// base): sin stock = 0, stock bajo = 1 unidad, en stock = 2 o más.
function estadoFromParams(searchParams: URLSearchParams): string {
  const min = searchParams.get("stockMin");
  const max = searchParams.get("stockMax");
  if (min === "0" && max === "0") return "sin_stock";
  if (min === "1" && max === "1") return "bajo";
  if (min === "2" && !max) return "en_stock";
  return "";
}

function paramsForEstado(value: string): { stockMin: string; stockMax: string } {
  switch (value) {
    case "sin_stock":
      return { stockMin: "0", stockMax: "0" };
    case "bajo":
      return { stockMin: "1", stockMax: "1" };
    case "en_stock":
      return { stockMin: "2", stockMax: "" };
    default:
      return { stockMin: "", stockMax: "" };
  }
}

const selectClass =
  "rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function InventarioFilterBar({
  businessUnits,
  categories,
  brands,
}: {
  businessUnits: BusinessUnit[];
  categories: Category[];
  brands: Brand[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [moreOpen, setMoreOpen] = useState(false);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function setParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const hasFilters = [...searchParams.keys()].some((k) =>
    ["q", "bu", "cat", "brand", "web", "stockMin", "stockMax", "priceWebMin", "priceWebMax"].includes(k)
  );

  return (
    <div className="font-inter space-y-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
          />
          <input
            type="text"
            placeholder="Buscar producto, SKU o marca..."
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => setParam("q", e.target.value)}
            className="w-full rounded-xl border border-mh-border py-2.5 pr-3 pl-9 text-sm focus:border-mh-pink focus:outline-none"
          />
        </div>

        <select
          defaultValue={searchParams.get("cat") ?? ""}
          onChange={(e) => setParam("cat", e.target.value)}
          className={selectClass}
        >
          <option value="">Categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("brand") ?? ""}
          onChange={(e) => setParam("brand", e.target.value)}
          className={selectClass}
        >
          <option value="">Marca</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("bu") ?? ""}
          onChange={(e) => setParam("bu", e.target.value)}
          className={selectClass}
        >
          <option value="">Unidad de negocio</option>
          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>
              {bu.name}
            </option>
          ))}
        </select>

        <select
          value={estadoFromParams(searchParams)}
          onChange={(e) => setParams(paramsForEstado(e.target.value))}
          className={selectClass}
        >
          {ESTADO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
            moreOpen
              ? "border-mh-pink bg-mh-pink-light text-mh-pink"
              : "border-mh-border text-mh-ink hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal size={15} />
          Más filtros
        </button>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-mh-ink-muted hover:text-mh-pink"
          >
            <X size={15} />
            Limpiar filtros
          </button>
        )}
      </div>

      {moreOpen && (
        <div className="flex flex-wrap items-center gap-4 border-t border-mh-border pt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-mh-ink-muted">Stock</span>
            <input
              type="number"
              placeholder="desde"
              defaultValue={searchParams.get("stockMin") ?? ""}
              onChange={(e) => setParam("stockMin", e.target.value)}
              className="w-20 rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
            />
            <input
              type="number"
              placeholder="hasta"
              defaultValue={searchParams.get("stockMax") ?? ""}
              onChange={(e) => setParam("stockMax", e.target.value)}
              className="w-20 rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-mh-ink-muted">P. Web</span>
            <input
              type="number"
              placeholder="desde"
              defaultValue={searchParams.get("priceWebMin") ?? ""}
              onChange={(e) => setParam("priceWebMin", e.target.value)}
              className="w-24 rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
            />
            <input
              type="number"
              placeholder="hasta"
              defaultValue={searchParams.get("priceWebMax") ?? ""}
              onChange={(e) => setParam("priceWebMax", e.target.value)}
              className="w-24 rounded-lg border border-mh-border px-2 py-1.5 text-sm focus:border-mh-pink focus:outline-none"
            />
          </div>
          <select
            defaultValue={searchParams.get("web") ?? ""}
            onChange={(e) => setParam("web", e.target.value)}
            className={selectClass}
          >
            <option value="">En web: todos</option>
            <option value="yes">En web: sí</option>
            <option value="no">En web: no</option>
          </select>
        </div>
      )}
    </div>
  );
}
