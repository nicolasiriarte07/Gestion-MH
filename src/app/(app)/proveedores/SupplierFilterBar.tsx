"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import type { Brand } from "@/lib/types";

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function SupplierFilterBar({
  categories,
  brands,
  cities,
}: {
  categories: string[];
  brands: Brand[];
  cities: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const hasFilters =
    searchParams.get("q") ||
    searchParams.get("cat") ||
    searchParams.get("brand") ||
    searchParams.get("city") ||
    searchParams.get("status") ||
    searchParams.get("sort");

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[240px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar proveedor, razón social o CUIT..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select
        defaultValue={searchParams.get("brand") ?? ""}
        onChange={(e) => setParam("brand", e.target.value)}
        className={selectClass}
      >
        <option value="">Marca: todas</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("cat") ?? ""}
        onChange={(e) => setParam("cat", e.target.value)}
        className={selectClass}
      >
        <option value="">Categoría: todas</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className={selectClass}
      >
        <option value="">Estado: todos</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
        <option value="con_deuda">Con deuda</option>
        <option value="al_dia">Al día</option>
      </select>

      <select
        defaultValue={searchParams.get("city") ?? ""}
        onChange={(e) => setParam("city", e.target.value)}
        className={selectClass}
      >
        <option value="">Localidad: todas</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("sort") ?? ""}
        onChange={(e) => setParam("sort", e.target.value)}
        className={selectClass}
      >
        <option value="">Ordenar por...</option>
        <option value="nombre">Nombre (A-Z)</option>
        <option value="deuda">Deuda (mayor a menor)</option>
        <option value="ultima_compra">Última compra (más reciente)</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
