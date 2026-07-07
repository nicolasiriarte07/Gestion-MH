"use client";

import { useMemo, useRef, useState } from "react";
import type {
  BusinessUnit,
  Category,
  Subcategory,
  Brand,
  Product,
} from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
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

// Markup = cuánto se suma sobre el costo para llegar al precio web.
// COGS % = qué porción del precio web representa el costo. Son valores
// calculados, no se guardan en la base.
function markupRatio(cost: number, priceWeb: number): number | null {
  return cost > 0 ? (priceWeb - cost) / cost : null;
}

function cogsRatio(cost: number, priceWeb: number): number | null {
  return priceWeb > 0 ? cost / priceWeb : null;
}

function formatPercent(ratio: number | null): string {
  return ratio === null ? "—" : `${(ratio * 100).toFixed(0)}%`;
}

// Excel necesita el punto y coma como separador (no la coma) para leer
// bien los archivos en español, y el ";" ya se usa en todos los exports
// de este proyecto para .csv.
const CSV_DELIMITER = ";";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map(csvCell).join(CSV_DELIMITER))
    .join("\r\n");
  // El BOM al principio hace que Excel detecte UTF-8 y muestre bien los
  // acentos (si no, "Categoría" se ve como "CategorÃ­a").
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function emptyDraft(): DraftProduct {
  return {
    id: `draft-${crypto.randomUUID()}`,
    isDraft: true,
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

type ColumnKey =
  | "sku"
  | "description"
  | "business_unit"
  | "category"
  | "brand"
  | "cost"
  | "price_cash"
  | "price_web"
  | "markup"
  | "cogs"
  | "stock"
  | "is_web"
  | "actions";

const COLUMNS: { key: ColumnKey; label: string; width: number; sortable: boolean }[] = [
  { key: "sku", label: "Código", width: 85, sortable: true },
  { key: "description", label: "Descripción", width: 190, sortable: true },
  { key: "business_unit", label: "Unidad de negocio", width: 190, sortable: true },
  { key: "category", label: "Categoría", width: 130, sortable: true },
  { key: "brand", label: "Marca", width: 120, sortable: true },
  { key: "cost", label: "Costo", width: 85, sortable: true },
  { key: "price_cash", label: "P. Contado", width: 90, sortable: true },
  { key: "price_web", label: "P. Web", width: 85, sortable: true },
  { key: "markup", label: "Markup", width: 65, sortable: true },
  { key: "cogs", label: "COGS", width: 65, sortable: true },
  { key: "stock", label: "Stock", width: 55, sortable: true },
  { key: "is_web", label: "Web", width: 50, sortable: true },
  { key: "actions", label: "", width: 95, sortable: false },
];

const MIN_COLUMN_WIDTH = 45;
const ROWS_PER_PAGE = 50;

export default function ProductsTable({
  initialProducts,
  businessUnits,
  categories,
  subcategories,
  brands,
}: {
  initialProducts: Product[];
  businessUnits: BusinessUnit[];
  categories: Category[];
  subcategories: Subcategory[];
  brands: Brand[];
}) {
  const [rows, setRows] = useState<Row[]>(initialProducts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [widths, setWidths] = useState<Record<ColumnKey, number>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])) as Record<
      ColumnKey,
      number
    >
  );
  const [sort, setSort] = useState<{ key: ColumnKey; dir: "asc" | "desc" } | null>(
    null
  );
  const [page, setPage] = useState(1);
  const resizeState = useRef<{ key: ColumnKey; startX: number } | null>(null);

  const businessUnitName = useMemo(() => {
    const map = new Map(businessUnits.map((bu) => [bu.id, bu.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [businessUnits]);

  const subcategoryName = useMemo(() => {
    const map = new Map(subcategories.map((s) => [s.id, s.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [subcategories]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [categories]);

  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [b.id, b.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [brands]);

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
      price_cash: draft.price_cash,
      price_web: draft.price_web,
      stock: draft.stock,
      is_web: draft.is_web,
      business_unit_id: draft.business_unit_id,
      category_id: draft.category_id,
      subcategory_id: draft.subcategory_id,
      brand_id: draft.brand_id,
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
    setRows((prev) => [emptyDraft(), ...prev]);
    setPage(1);
  }

  function handleResizeStart(key: ColumnKey, e: React.MouseEvent) {
    e.preventDefault();
    resizeState.current = { key, startX: e.clientX };

    function handleMouseMove(ev: MouseEvent) {
      if (!resizeState.current) return;
      const delta = ev.clientX - resizeState.current.startX;
      resizeState.current.startX = ev.clientX;
      setWidths((prev) => ({
        ...prev,
        [resizeState.current!.key]: Math.max(
          MIN_COLUMN_WIDTH,
          prev[resizeState.current!.key] + delta
        ),
      }));
    }
    function handleMouseUp() {
      resizeState.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function toggleSort(key: ColumnKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  const sortedRows = useMemo(() => {
    function sortValue(row: Product, key: ColumnKey): string | number {
      switch (key) {
        case "sku":
          return row.sku.toLowerCase();
        case "description":
          return row.description.toLowerCase();
        case "business_unit":
          return businessUnitName(row.business_unit_id).toLowerCase();
        case "category":
          return categoryName(row.category_id).toLowerCase();
        case "brand":
          return brandName(row.brand_id).toLowerCase();
        case "cost":
          return row.cost;
        case "price_cash":
          return row.price_cash;
        case "price_web":
          return row.price_web;
        case "markup":
          return markupRatio(row.cost, row.price_web) ?? -Infinity;
        case "cogs":
          return cogsRatio(row.cost, row.price_web) ?? -Infinity;
        case "stock":
          return row.stock;
        case "is_web":
          return row.is_web ? 1 : 0;
        default:
          return "";
      }
    }

    const draftRows = rows.filter(isDraft);
    const productRows = rows.filter((r): r is Product => !isDraft(r));
    if (!sort) return [...draftRows, ...productRows];

    const sortedProducts = [...productRows].sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return [...draftRows, ...sortedProducts];
  }, [rows, sort, businessUnitName, categoryName, brandName]);

  const totalWidth = COLUMNS.reduce((sum, c) => sum + widths[c.key], 0);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  function parseCurrencyInput(
    e: React.FocusEvent<HTMLInputElement>,
    current: number
  ): number | null {
    const value = parseFlexibleNumber(e.target.value);
    e.target.value = formatCurrency(value);
    return value === current ? null : value;
  }

  function exportCsv() {
    const header = [
      "Código",
      "Descripción",
      "Unidad de negocio",
      "Categoría",
      "Subcategoría",
      "Marca",
      "Costo",
      "P. Contado",
      "P. Web",
      "Markup",
      "COGS",
      "Stock",
      "Publicado",
    ];

    const dataRows = sortedRows
      .filter((row): row is Product => !isDraft(row))
      .map((row) => [
        row.sku,
        row.description,
        businessUnitName(row.business_unit_id) || "Sin asignar",
        categoryName(row.category_id) || "Sin categoría",
        subcategoryName(row.subcategory_id) || "Sin subcategoría",
        brandName(row.brand_id) || "Sin marca",
        row.cost,
        row.price_cash,
        row.price_web,
        formatPercent(markupRatio(row.cost, row.price_web)),
        formatPercent(cogsRatio(row.cost, row.price_web)),
        row.stock,
        row.is_web ? "Sí" : "No",
      ]);

    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`inventario-${today}.csv`, [header, ...dataRows]);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">
            Productos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Exportar
            </button>
            <button
              onClick={addDraftRow}
              className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark"
            >
              + Nuevo producto
            </button>
          </div>
        </div>

        <table
          className="text-xs"
          style={{ tableLayout: "fixed", width: totalWidth }}
        >
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: widths[col.key] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="relative px-3 py-2 font-medium select-none"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      {col.label}
                      {sort?.key === col.key && (
                        <span>{sort.dir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                  <div
                    onMouseDown={(e) => handleResizeStart(col.key, e)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-brand/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const draft = isDraft(row);
              const saving = savingIds.has(row.id);
              const error = errors[row.id];

              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 align-top last:border-0 ${
                    row.is_web
                      ? "bg-emerald-50 hover:bg-emerald-100"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={row.sku}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value === row.sku) return;
                        applyChange(row, draft, { sku: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={row.description}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value === row.description) return;
                        applyChange(row, draft, { description: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <select
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
                      value={row.business_unit_id ?? ""}
                      onChange={(e) => {
                        applyChange(row, draft, {
                          business_unit_id: e.target.value || null,
                        });
                      }}
                    >
                      <option value="">Sin asignar</option>
                      {businessUnits.map((bu) => (
                        <option key={bu.id} value={bu.id}>
                          {bu.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <select
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
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
                  <td className="overflow-hidden px-2 py-1">
                    <select
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
                      value={row.brand_id ?? ""}
                      onChange={(e) => {
                        applyChange(row, draft, {
                          brand_id: e.target.value || null,
                        });
                      }}
                    >
                      <option value="">Sin marca</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full rounded border border-transparent px-1.5 py-1 text-right hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={formatCurrency(row.cost)}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const value = parseCurrencyInput(e, row.cost);
                        if (value !== null)
                          applyChange(row, draft, { cost: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full rounded border border-transparent px-1.5 py-1 text-right hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={formatCurrency(row.price_cash)}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const value = parseCurrencyInput(e, row.price_cash);
                        if (value !== null)
                          applyChange(row, draft, { price_cash: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full rounded border border-transparent px-1.5 py-1 text-right hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={formatCurrency(row.price_web)}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const value = parseCurrencyInput(e, row.price_web);
                        if (value !== null)
                          applyChange(row, draft, { price_web: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1 whitespace-nowrap text-slate-600">
                    {formatPercent(markupRatio(row.cost, row.price_web))}
                  </td>
                  <td className="overflow-hidden px-2 py-1 whitespace-nowrap text-slate-600">
                    {formatPercent(cogsRatio(row.cost, row.price_web))}
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <input
                      type="number"
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-300 focus:border-brand focus:outline-none"
                      defaultValue={row.stock}
                      onBlur={(e) => {
                        const value = Number(e.target.value) || 0;
                        if (value === row.stock) return;
                        applyChange(row, draft, { stock: value });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={row.is_web}
                      onChange={(e) => {
                        applyChange(row, draft, { is_web: e.target.checked });
                      }}
                    />
                  </td>
                  <td className="overflow-hidden px-2 py-1">
                    <div className="flex items-center gap-2">
                      {draft && (
                        <button
                          onClick={() => saveDraft(row as DraftProduct)}
                          disabled={saving}
                          className="rounded bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
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
                      <p className="mt-1 text-xs text-red-600">{error}</p>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {sortedRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
            <span>
              Mostrando {(currentPage - 1) * ROWS_PER_PAGE + 1}–
              {Math.min(currentPage * ROWS_PER_PAGE, sortedRows.length)} de{" "}
              {sortedRows.length} producto(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
