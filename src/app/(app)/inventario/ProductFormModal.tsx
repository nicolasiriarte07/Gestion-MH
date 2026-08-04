"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import type { BusinessUnit, Category, Subcategory, Brand, Product } from "@/lib/types";
import { createProduct, updateProduct, type ProductInput } from "./actions";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-mh-ink-muted";

function emptyInput(): ProductInput {
  return {
    sku: "",
    description: "",
    cost: 0,
    price_cash: 0,
    price_web: 0,
    stock: 0,
    is_web: false,
    business_unit_id: null,
    category_id: null,
    subcategory_id: null,
    brand_id: null,
  };
}

export default function ProductFormModal({
  product,
  businessUnits,
  categories,
  subcategories,
  brands,
  onClose,
  onSaved,
}: {
  product: Product | null;
  businessUnits: BusinessUnit[];
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          sku: product.sku,
          description: product.description,
          cost: product.cost,
          price_cash: product.price_cash,
          price_web: product.price_web,
          stock: product.stock,
          is_web: product.is_web,
          business_unit_id: product.business_unit_id,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          brand_id: product.brand_id,
        }
      : emptyInput()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subcategoryOptions = subcategories.filter(
    (s) => s.category_id === form.category_id
  );

  function patch(fields: Partial<ProductInput>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.description.trim()) {
      setError("Código y descripción son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = product
      ? await updateProduct(product.id, form)
      : await createProduct(form);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result.data as Product);
  }

  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Código</label>
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => patch({ sku: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Marca</label>
            <select
              className={inputClass}
              value={form.brand_id ?? ""}
              onChange={(e) => patch({ brand_id: e.target.value || null })}
            >
              <option value="">Sin marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <input
            className={inputClass}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Unidad de negocio</label>
            <select
              className={inputClass}
              value={form.business_unit_id ?? ""}
              onChange={(e) => patch({ business_unit_id: e.target.value || null })}
            >
              <option value="">Sin asignar</option>
              {businessUnits.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              className={inputClass}
              value={form.category_id ?? ""}
              onChange={(e) =>
                patch({ category_id: e.target.value || null, subcategory_id: null })
              }
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.category_id && subcategoryOptions.length > 0 && (
          <div>
            <label className={labelClass}>Subcategoría</label>
            <select
              className={inputClass}
              value={form.subcategory_id ?? ""}
              onChange={(e) => patch({ subcategory_id: e.target.value || null })}
            >
              <option value="">Sin subcategoría</option>
              {subcategoryOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Costo</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.cost ? formatCurrency(form.cost) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => patch({ cost: parseFlexibleNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>P. Contado</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.price_cash ? formatCurrency(form.price_cash) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => patch({ price_cash: parseFlexibleNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>P. Web</label>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              defaultValue={form.price_web ? formatCurrency(form.price_web) : ""}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => patch({ price_web: parseFlexibleNumber(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Stock</label>
            <input
              type="number"
              className={inputClass}
              value={form.stock}
              onChange={(e) => patch({ stock: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
          <input
            type="checkbox"
            className="accent-mh-pink"
            checked={form.is_web}
            onChange={(e) => patch({ is_web: e.target.checked })}
          />
          Publicado en la web
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-mh-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-mh-ink-muted hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
