"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { BusinessUnit, Category, Brand } from "@/lib/types";
import Input from "@/components/ds/Input";
import Select from "@/components/ds/Select";
import Button from "@/components/ds/Button";

// Por defecto (sin nada elegido) la tabla ya solo muestra productos con
// stock >= 1 (ver page.tsx); para ver los de 0 hay que elegir "Sin stock"
// o "Todos" a propósito acá.
const ESTADO_OPTIONS = [
  { value: "", label: "Estado: con stock" },
  { value: "en_stock", label: "En stock (2+)" },
  { value: "bajo", label: "Stock bajo (1)" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "todos", label: "Todos (incluye sin stock)" },
];

// El filtro "Estado" es una traducción amigable de los mismos
// stockMin/stockMax que ya entiende la tabla (no es un campo nuevo en la
// base): sin stock = 0, stock bajo = 1 unidad, en stock = 2 o más, todos =
// sin filtro de stock (stockAll=1, la única forma de ver los de 0 junto
// con el resto).
function estadoFromParams(searchParams: URLSearchParams): string {
  if (searchParams.get("stockAll") === "1") return "todos";
  const min = searchParams.get("stockMin");
  const max = searchParams.get("stockMax");
  if (min === "0" && max === "0") return "sin_stock";
  if (min === "1" && max === "1") return "bajo";
  if (min === "2" && !max) return "en_stock";
  return "";
}

function paramsForEstado(
  value: string
): { stockMin: string; stockMax: string; stockAll: string } {
  switch (value) {
    case "sin_stock":
      return { stockMin: "0", stockMax: "0", stockAll: "" };
    case "bajo":
      return { stockMin: "1", stockMax: "1", stockAll: "" };
    case "en_stock":
      return { stockMin: "2", stockMax: "", stockAll: "" };
    case "todos":
      return { stockMin: "", stockMax: "", stockAll: "1" };
    default:
      return { stockMin: "", stockMax: "", stockAll: "" };
  }
}

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
    ["q", "bu", "cat", "brand", "web", "stockMin", "stockMax", "stockAll", "priceWebMin", "priceWebMax"].includes(k)
  );

  return (
    <div className="font-inter space-y-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[240px] flex-1">
          <Input
            icon={<Search size={16} />}
            type="text"
            placeholder="Buscar producto, SKU o marca..."
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => setParam("q", e.target.value)}
          />
        </div>

        <div className="w-44">
          <Select
            defaultValue={searchParams.get("cat") ?? ""}
            onChange={(e) => setParam("cat", e.target.value)}
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            defaultValue={searchParams.get("brand") ?? ""}
            onChange={(e) => setParam("brand", e.target.value)}
          >
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-48">
          <Select
            defaultValue={searchParams.get("bu") ?? ""}
            onChange={(e) => setParam("bu", e.target.value)}
          >
            <option value="">Unidad de negocio</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-56">
          <Select
            value={estadoFromParams(searchParams)}
            onChange={(e) => setParams(paramsForEstado(e.target.value))}
          >
            {ESTADO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant="secondary"
          className={moreOpen ? "!border-mh-pink !bg-mh-pink-light !text-mh-pink" : ""}
          icon={<SlidersHorizontal size={15} />}
          onClick={() => setMoreOpen((o) => !o)}
        >
          Más filtros
        </Button>

        {hasFilters && (
          <Button variant="ghost" icon={<X size={15} />} onClick={() => router.push(pathname)}>
            Limpiar filtros
          </Button>
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
          <div className="w-40">
            <Select
              defaultValue={searchParams.get("web") ?? ""}
              onChange={(e) => setParam("web", e.target.value)}
            >
              <option value="">En web: todos</option>
              <option value="yes">En web: sí</option>
              <option value="no">En web: no</option>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
