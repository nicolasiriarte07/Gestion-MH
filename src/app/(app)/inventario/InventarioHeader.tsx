"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Plus } from "lucide-react";
import type { BusinessUnit, Category, Subcategory, Brand } from "@/lib/types";
import ProductFormModal from "./ProductFormModal";

export default function InventarioHeader({
  businessUnits,
  categories,
  subcategories,
  brands,
}: {
  businessUnits: BusinessUnit[];
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-inter text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          Inventario
        </h1>
        <p className="font-inter mt-1 text-sm font-medium text-mh-ink-muted">
          Administrá los productos y el stock de tu negocio
        </p>
      </div>

      <div className="font-inter flex items-center gap-3">
        <Link
          href="/inventario/import"
          className="flex items-center gap-1.5 rounded-xl border border-mh-border bg-white px-4 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50"
        >
          <Upload size={16} />
          Importar Excel
        </Link>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      {creating && (
        <ProductFormModal
          product={null}
          businessUnits={businessUnits}
          categories={categories}
          subcategories={subcategories}
          brands={brands}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
