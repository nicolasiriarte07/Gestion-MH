"use client";

import { useMemo, useState } from "react";
import type {
  BusinessUnit,
  Category,
  Subcategory,
  Product,
} from "@/lib/types";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "./actions";

type DraftProduct = ProductInput & { id: string; isDraft: true };
type Row = Product | DraftProduct;

function isDraft(row: Row): row is DraftProduct {
  return "isDraft" in row;
}

function emptyDraft(defaultBusinessUnitId: string): DraftProduct {
  return {
    id: `draft-${crypto.randomUUID()}`,
    isDraft: true,
    sku: "",
    description: "",
    cost: 0,
    sale_price: 0,
    stock: 0,
    is_web: false,
    business_unit_id: defaultBusinessUnitId,
    category_id: null,
    subcategory_id: null,
  };
}

export default function ProductsTable({
  initialProducts,
  businessUnits,
  categories,
  subcategories,
}: {
  initialProducts: Product[];
  businessUnits: BusinessUnit[];
  categories: Category[];
  subcategories: Subcategory[];
}) {
  const [rows, setRows] = useState<Row[]>(initialProducts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, Subcategory[]>();
    for (const sub of subcategories) {
      const list = map.get(sub.category_id) ?? [];
      list.push(sub);
      map.set(sub.category_id, list);
    }
    return map;
  }, [subcategories]);

  function patchRow(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, ...patch } as Row) : r))
    );
  }

  function setError(id: string, message: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  function setSaving(id: string, saving: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function saveField(row: Product, patch: Partial<ProductInput>) {
    setSaving(row.id, true);
    setError(row.id, null);
    const result = await updateProduct(row.id, patch);
    setSaving(row.id, false);

    if (result.error) {
      setError(row.id, result.error);
      return;
    }
    patchRow(row.id, patch as Partial<Row>);
  }

  // Para filas nuevas (draft) el cambio solo se guarda en memoria hasta
  // que el usuario confirma con "Guardar"; para filas existentes se
  // persiste de inmediato en Supabase.
  function applyChange(
    row: Row,
    draft: boolean,
    patch: Partial<ProductInput>
  ) {
    if (draft) {
      patchRow(row.id, patch as Partial<Row>);
    } else {
      saveField(row as Product, patch);
    }
  }

  async function saveDraft(draft: DraftProduct) {
    if (!draft.sku.trim() || !draft.description.trim()) {
      setError(draft.id, "Código y descripción son obligatorios.");
      return;
    }

    setSaving(draft.id, true);
    setError(draft.id, null);

    const input: ProductInput = {
      sku: draft.sku,
      description: draft.description,
      cost: draft.cost,
      sale_price: draft.sale_price,
      stock: draft.stock,
      is_web: draft.is_web,
      business_unit_id: draft.business_unit_id,
      category_id: draft.category_id,
      subcategory_id: draft.subcategory_id,
    };
    const result = await createProduct(input);
    setSaving(draft.id, false);

    if (result.error) {
      setError(draft.id, result.error);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === draft.id ? (result.data as Product) : r))
    );
  }

  async function handleDelete(row: Row) {
    if (isDraft(row)) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(`¿Eliminar "${row.description}" (${row.sku})?`)) return;

    setSaving(row.id, true);
    const result = await deleteProduct(row.id);
    setSaving(row.id, false);

    if (result.error) {
      setError(row.id, result.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  function addDraftRow() {
    setRows((prev) => [emptyDraft(businessUnits[0]?.id ?? ""), ...prev]);
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <span className="text-sm font-medium text-slate-700">Productos</span>
        <button
          onClick={addDraftRow}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          + Nuevo producto
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Código</th>
            <th className="px-3 py-2 font-medium">Descripción</th>
            <th className="px-3 py-2 font-medium">Unidad de negocio</th>
            <th className="px-3 py-2 font-medium">Categoría</th>
            <th className="px-3 py-2 font-medium">Subcategoría</th>
            <th className="px-3 py-2 font-medium">Costo</th>
            <th className="px-3 py-2 font-medium">P. Venta</th>
            <th className="px-3 py-2 font-medium">Stock</th>
            <th className="px-3 py-2 font-medium">Web</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const draft = isDraft(row);
            const rowSubcategories = row.category_id
              ? (subcategoriesByCategory.get(row.category_id) ?? [])
              : [];
            const saving = savingIds.has(row.id);
            const error = errors[row.id];

            return (
              <tr
                key={row.id}
                className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50"
              >
                <td className="px-3 py-1.5">
                  <input
                    className="w-28 rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    defaultValue={row.sku}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === row.sku) return;
                      applyChange(row, draft, { sku: value });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    className="w-64 rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    defaultValue={row.description}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === row.description) return;
                      applyChange(row, draft, { description: value });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    value={row.business_unit_id}
                    onChange={(e) => {
                      applyChange(row, draft, {
                        business_unit_id: e.target.value,
                      });
                    }}
                  >
                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    value={row.category_id ?? ""}
                    onChange={(e) => {
                      applyChange(row, draft, {
                        category_id: e.target.value || null,
                        subcategory_id: null,
                      });
                    }}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    value={row.subcategory_id ?? ""}
                    disabled={!row.category_id}
                    onChange={(e) => {
                      applyChange(row, draft, {
                        subcategory_id: e.target.value || null,
                      });
                    }}
                  >
                    <option value="">Sin subcategoría</option>
                    {rowSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    defaultValue={row.cost}
                    onBlur={(e) => {
                      const value = Number(e.target.value) || 0;
                      if (value === row.cost) return;
                      applyChange(row, draft, { cost: value });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    defaultValue={row.sale_price}
                    onBlur={(e) => {
                      const value = Number(e.target.value) || 0;
                      if (value === row.sale_price) return;
                      applyChange(row, draft, { sale_price: value });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-20 rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                    defaultValue={row.stock}
                    onBlur={(e) => {
                      const value = Number(e.target.value) || 0;
                      if (value === row.stock) return;
                      applyChange(row, draft, { stock: value });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.is_web}
                    onChange={(e) => {
                      applyChange(row, draft, { is_web: e.target.checked });
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {draft && (
                      <button
                        onClick={() => saveDraft(row as DraftProduct)}
                        disabled={saving}
                        className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {saving ? "..." : "Guardar"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={saving}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                  {error && (
                    <p className="mt-1 max-w-[160px] text-xs text-red-600">
                      {error}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="px-3 py-8 text-center text-slate-400"
              >
                No hay productos que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
