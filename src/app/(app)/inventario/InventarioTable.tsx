"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  MoreHorizontal,
  Pencil,
  PackagePlus,
  Trash2,
  Download,
  Upload,
  Tag,
  DollarSign,
  Truck,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Card from "@/components/ds/Card";
import Badge from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import type { BusinessUnit, Category, Subcategory, Brand, Product } from "@/lib/types";
import { deleteProduct } from "./actions";
import { stockTone, stockLabel, stockTextClass } from "./stockStatus";
import InventarioDrawer from "./InventarioDrawer";
import ProductFormModal from "./ProductFormModal";
import StockAdjustModal from "./StockAdjustModal";

type ColumnKey =
  | "description"
  | "sku"
  | "brand"
  | "category"
  | "stock"
  | "cost"
  | "price_cash"
  | "margin"
  | "estado";

const COLUMN_DEFS: { key: ColumnKey; label: string; width: number }[] = [
  { key: "description", label: "Producto", width: 240 },
  { key: "sku", label: "SKU", width: 120 },
  { key: "brand", label: "Marca", width: 120 },
  { key: "category", label: "Categoría", width: 160 },
  { key: "stock", label: "Stock", width: 80 },
  { key: "cost", label: "Costo", width: 100 },
  { key: "price_cash", label: "Precio", width: 100 },
  { key: "margin", label: "Margen", width: 90 },
  { key: "estado", label: "Estado", width: 120 },
];

const CHECKBOX_COL_WIDTH = 44;
const THUMB_COL_WIDTH = 56;
const ACTIONS_COL_WIDTH = 48;
const MIN_COLUMN_WIDTH = 60;

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function marginOf(p: Product): number | null {
  return p.price_cash > 0 ? (p.price_cash - p.cost) / p.price_cash : null;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function InventarioTable({
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
  const [rows, setRows] = useState<Product[]>(initialProducts);
  const [sort, setSort] = useState<{ key: ColumnKey; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [formProduct, setFormProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [widths, setWidths] = useState<Record<ColumnKey, number>>(() =>
    Object.fromEntries(COLUMN_DEFS.map((c) => [c.key, c.width])) as Record<
      ColumnKey,
      number
    >
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const resizeState = useRef<{ key: ColumnKey; startX: number } | null>(null);

  function handleResizeStart(key: ColumnKey, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const businessUnitName = useMemo(() => {
    const map = new Map(businessUnits.map((bu) => [bu.id, bu.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [businessUnits]);
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [categories]);
  const brandName = useMemo(() => {
    const map = new Map(brands.map((b) => [b.id, b.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [brands]);

  function toggleSort(key: ColumnKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    function value(p: Product): string | number {
      switch (sort!.key) {
        case "description":
          return p.description.toLowerCase();
        case "sku":
          return p.sku.toLowerCase();
        case "brand":
          return brandName(p.brand_id).toLowerCase();
        case "category":
          return categoryName(p.category_id).toLowerCase();
        case "stock":
        case "estado":
          return p.stock;
        case "cost":
          return p.cost;
        case "price_cash":
          return p.price_cash;
        case "margin":
          return marginOf(p) ?? -Infinity;
        default:
          return "";
      }
    }
    return [...rows].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, brandName, categoryName]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allPageSelected = pagedRows.length > 0 && pagedRows.every((p) => selectedIds.has(p.id));

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedRows.forEach((p) => next.delete(p.id));
      } else {
        pagedRows.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaved(product: Product) {
    setRows((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
    setFormProduct(null);
    setAdjustingProduct(null);
    setViewingProduct((v) => (v && v.id === product.id ? product : v));
  }

  async function handleDeleteOne(product: Product) {
    if (!confirm(`¿Eliminar "${product.description}" (${product.sku})?`)) return;
    const result = await deleteProduct(product.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    setRows((prev) => prev.filter((p) => p.id !== product.id));
    setViewingProduct(null);
    setOpenMenuId(null);
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} producto(s) seleccionado(s)?`)) return;
    setDeleting(true);
    const ids = [...selectedIds];
    const results = await Promise.all(ids.map((id) => deleteProduct(id)));
    const failed = results.filter((r) => r.error).length;
    setRows((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelectedIds(new Set());
    setDeleting(false);
    if (failed > 0) {
      alert(`${failed} producto(s) no se pudieron eliminar.`);
    }
  }

  function exportCsv() {
    const header = [
      "Código", "Descripción", "Marca", "Categoría", "Unidad de negocio",
      "Stock", "Costo", "P. Contado", "P. Web", "Margen", "Estado", "Publicado",
    ];
    const dataRows = sortedRows.map((p) => {
      const margin = marginOf(p);
      return [
        p.sku, p.description, brandName(p.brand_id) || "Sin marca",
        categoryName(p.category_id) || "Sin categoría",
        businessUnitName(p.business_unit_id) || "Sin asignar",
        p.stock, p.cost, p.price_cash, p.price_web,
        margin === null ? "—" : `${(margin * 100).toFixed(0)}%`,
        stockLabel(p.stock), p.is_web ? "Sí" : "No",
      ];
    });
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`inventario-${today}.csv`, [header, ...dataRows]);
  }

  const totalWidth =
    CHECKBOX_COL_WIDTH +
    THUMB_COL_WIDTH +
    COLUMN_DEFS.reduce((sum, c) => sum + widths[c.key], 0) +
    ACTIONS_COL_WIDTH;

  return (
    <Card padded={false} className="font-inter overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mh-border px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton icon={Download} label="Exportar" onClick={exportCsv} />
          <Link href="/inventario/import">
            <ToolbarButton icon={Upload} label="Importar" />
          </Link>
          <ToolbarButton icon={Tag} label="Etiquetas" disabled title="Próximamente" />
          <ToolbarButton icon={DollarSign} label="Actualizar precios" disabled title="Próximamente" />
          <Link href="/inventario?stockMax=1">
            <ToolbarButton icon={Truck} label="Reposición" />
          </Link>
          <ToolbarButton
            icon={Trash2}
            label="Eliminar"
            danger
            disabled={selectedIds.size === 0 || deleting}
            onClick={handleDeleteSelected}
          />
        </div>
        {selectedIds.size > 0 && (
          <span className="text-sm font-semibold text-mh-pink">
            {selectedIds.size} seleccionado(s)
          </span>
        )}
      </div>

      <div className="max-h-[640px] overflow-auto">
        <table className="text-sm" style={{ tableLayout: "fixed", width: totalWidth }}>
          <colgroup>
            <col style={{ width: CHECKBOX_COL_WIDTH }} />
            <col style={{ width: THUMB_COL_WIDTH }} />
            {COLUMN_DEFS.map((col) => (
              <col key={col.key} style={{ width: widths[col.key] }} />
            ))}
            <col style={{ width: ACTIONS_COL_WIDTH }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-mh-bg">
            <tr className="border-b border-mh-border text-left text-xs font-semibold text-mh-ink-muted uppercase">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                />
              </th>
              <th className="px-2 py-3" />
              {COLUMN_DEFS.map((col) => (
                <th key={col.key} className="relative px-3 py-3 font-semibold select-none">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 truncate uppercase hover:text-mh-ink"
                  >
                    {col.label}
                    {sort?.key === col.key &&
                      (sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </button>
                  <div
                    onMouseDown={(e) => handleResizeStart(col.key, e)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-mh-pink/30"
                  />
                </th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((p) => {
              const margin = marginOf(p);
              return (
                <tr
                  key={p.id}
                  onClick={() => setViewingProduct(p)}
                  className="cursor-pointer border-b border-mh-border/70 transition-colors last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-mh-pink"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mh-bg text-mh-ink-muted">
                      <Package size={18} />
                    </div>
                  </td>
                  <td className="overflow-hidden px-3 py-3">
                    <p className="truncate font-bold text-mh-ink">{p.description}</p>
                    <p className="truncate text-xs text-mh-ink-muted">{p.sku}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                    <p className="truncate">{p.sku}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink">
                    <p className="truncate">{brandName(p.brand_id) || "—"}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3">
                    {p.category_id ? (
                      <Badge tone="pink">{categoryName(p.category_id)}</Badge>
                    ) : (
                      <span className="text-mh-ink-muted">—</span>
                    )}
                  </td>
                  <td className={`overflow-hidden px-3 py-3 font-bold ${stockTextClass(p.stock)}`}>{p.stock}</td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink">
                    <p className="truncate">{formatCurrency(p.cost)}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 font-semibold text-mh-ink">
                    <p className="truncate">{formatCurrency(p.price_cash)}</p>
                  </td>
                  <td className="overflow-hidden px-3 py-3 text-mh-ink">{margin === null ? "—" : `${(margin * 100).toFixed(0)}%`}</td>
                  <td className="overflow-hidden px-3 py-3">
                    <Badge tone={stockTone(p.stock)}>{stockLabel(p.stock)}</Badge>
                  </td>
                  <td className="relative px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId((id) => (id === p.id ? null : p.id))}
                      className="rounded-lg p-1.5 text-mh-ink-muted hover:bg-slate-100 hover:text-mh-ink"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === p.id && (
                      <div
                        ref={menuRef}
                        className="absolute top-full right-3 z-20 w-44 rounded-xl border border-mh-border bg-white py-1 shadow-lg"
                      >
                        <MenuItem icon={Pencil} label="Editar" onClick={() => { setFormProduct(p); setOpenMenuId(null); }} />
                        <MenuItem icon={PackagePlus} label="Ajustar stock" onClick={() => { setAdjustingProduct(p); setOpenMenuId(null); }} />
                        <MenuItem icon={Trash2} label="Eliminar" danger onClick={() => handleDeleteOne(p)} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={COLUMN_DEFS.length + 3} className="px-6 py-16 text-center text-mh-ink-muted">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mh-border px-6 py-4 text-sm text-mh-ink-muted">
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedRows.length)} de {sortedRows.length} producto(s)
          </span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              Productos por página
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-mh-border px-2 py-1 text-sm focus:border-mh-pink focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}

      {viewingProduct && (
        <InventarioDrawer
          product={viewingProduct}
          categoryName={categoryName}
          brandName={brandName}
          onClose={() => setViewingProduct(null)}
          onEdit={(p) => setFormProduct(p)}
          onAdjustStock={(p) => setAdjustingProduct(p)}
        />
      )}

      {formProduct && (
        <ProductFormModal
          product={formProduct}
          businessUnits={businessUnits}
          categories={categories}
          subcategories={subcategories}
          brands={brands}
          onClose={() => setFormProduct(null)}
          onSaved={handleSaved}
        />
      )}

      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={handleSaved}
        />
      )}
    </Card>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
  title,
}: {
  icon: typeof Download;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-mh-border text-red-600 hover:border-red-300 hover:bg-red-50"
          : "border-mh-border text-mh-ink hover:bg-slate-50"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-slate-50 ${
        danger ? "text-red-600" : "text-mh-ink"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) items.push("ellipsis");
    items.push(p);
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1.5">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${
              item === currentPage
                ? "bg-mh-pink text-white"
                : "text-mh-ink hover:bg-slate-100"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
