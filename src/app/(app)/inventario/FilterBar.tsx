"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { BusinessUnit, Category, Brand } from "@/lib/types";

export default function FilterBar({
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

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        type="text"
        placeholder="Buscar por código o descripción..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => setParam("q", e.target.value)}
        className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      />

      <select
        defaultValue={searchParams.get("bu") ?? ""}
        onChange={(e) => setParam("bu", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Unidad de negocio: todas</option>
        {businessUnits.map((bu) => (
          <option key={bu.id} value={bu.id}>
            {bu.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("cat") ?? ""}
        onChange={(e) => setParam("cat", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Categoría: todas</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
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
        defaultValue={searchParams.get("web") ?? ""}
        onChange={(e) => setParam("web", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">En web: todos</option>
        <option value="yes">En web: sí</option>
        <option value="no">En web: no</option>
      </select>

      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500">Stock</span>
        <input
          type="number"
          placeholder="desde"
          defaultValue={searchParams.get("stockMin") ?? ""}
          onChange={(e) => setParam("stockMin", e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <input
          type="number"
          placeholder="hasta"
          defaultValue={searchParams.get("stockMax") ?? ""}
          onChange={(e) => setParam("stockMax", e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500">P. Web</span>
        <input
          type="number"
          placeholder="desde"
          defaultValue={searchParams.get("priceWebMin") ?? ""}
          onChange={(e) => setParam("priceWebMin", e.target.value)}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <input
          type="number"
          placeholder="hasta"
          defaultValue={searchParams.get("priceWebMax") ?? ""}
          onChange={(e) => setParam("priceWebMax", e.target.value)}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {(searchParams.get("q") ||
        searchParams.get("bu") ||
        searchParams.get("cat") ||
        searchParams.get("brand") ||
        searchParams.get("web") ||
        searchParams.get("stockMin") ||
        searchParams.get("stockMax") ||
        searchParams.get("priceWebMin") ||
        searchParams.get("priceWebMax")) && (
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
