"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Brand } from "@/lib/types";

export default function SupplierFilterBar({
  categories,
  brands,
}: {
  categories: string[];
  brands: Brand[];
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
    searchParams.get("status") ||
    searchParams.get("sort");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        type="text"
        placeholder="Buscar por nombre, razón social o CUIT..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => setParam("q", e.target.value)}
        className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      />

      <select
        defaultValue={searchParams.get("cat") ?? ""}
        onChange={(e) => setParam("cat", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Categoría: todas</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("brand") ?? ""}
        onChange={(e) => setParam("brand", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Marca: todas</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Estado: todos</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>

      <select
        defaultValue={searchParams.get("sort") ?? ""}
        onChange={(e) => setParam("sort", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Ordenar por...</option>
        <option value="nombre">Nombre (A-Z)</option>
        <option value="deuda">Deuda (mayor a menor)</option>
        <option value="ultima_compra">Última compra (más reciente)</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
