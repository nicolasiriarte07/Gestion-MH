"use client";

import { useMemo, useState } from "react";
import type { BusinessUnit, Product } from "@/lib/types";
import { confirmMatch, markNoMatch } from "./actions";

export type PendingGroup = {
  description: string;
  businessUnitId: string | null;
  count: number;
  suggestedProductId: string | null;
  suggestedScore: number | null;
};

const PAGE_SIZE = 25;

export default function MatchReview({
  groups,
  products,
  businessUnits,
}: {
  groups: PendingGroup[];
  products: Pick<Product, "id" | "sku" | "description" | "business_unit_id">[];
  businessUnits: BusinessUnit[];
}) {
  const [remaining, setRemaining] = useState(groups);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessUnitName = useMemo(() => {
    const map = new Map(businessUnits.map((bu) => [bu.id, bu.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "?") : "Sin unidad");
  }, [businessUnits]);

  const productsByUnit = useMemo(() => {
    const map = new Map<string | null, typeof products>();
    for (const p of products) {
      const key = p.business_unit_id;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return remaining;
    return remaining.filter((g) => g.description.toLowerCase().includes(q));
  }, [remaining, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function groupKey(g: PendingGroup) {
    return `${g.businessUnitId ?? "none"}::${g.description}`;
  }

  function candidatesFor(g: PendingGroup) {
    return g.businessUnitId
      ? (productsByUnit.get(g.businessUnitId) ?? [])
      : products;
  }

  async function handleConfirm(g: PendingGroup) {
    const key = groupKey(g);
    const productId = selected[key] ?? g.suggestedProductId;
    if (!productId) {
      setErrors((prev) => ({ ...prev, [key]: "Elegí un producto primero." }));
      return;
    }

    setSaving((prev) => new Set(prev).add(key));
    const confidence =
      productId === g.suggestedProductId && g.suggestedScore !== null
        ? Math.round(g.suggestedScore * 100)
        : null;

    const result = await confirmMatch(
      { description: g.description, businessUnitId: g.businessUnitId },
      productId,
      confidence
    );

    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (result.error) {
      setErrors((prev) => ({ ...prev, [key]: result.error as string }));
      return;
    }

    setRemaining((prev) => prev.filter((r) => groupKey(r) !== key));
  }

  async function handleNoMatch(g: PendingGroup) {
    const key = groupKey(g);
    setSaving((prev) => new Set(prev).add(key));

    const result = await markNoMatch({
      description: g.description,
      businessUnitId: g.businessUnitId,
    });

    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (result.error) {
      setErrors((prev) => ({ ...prev, [key]: result.error as string }));
      return;
    }

    setRemaining((prev) => prev.filter((r) => groupKey(r) !== key));
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Buscar por descripción..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="w-full max-w-md rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
      />

      <div className="space-y-2">
        {visible.map((g) => {
          const key = groupKey(g);
          const candidates = candidatesFor(g);
          const value = selected[key] ?? g.suggestedProductId ?? "";
          const isSaving = saving.has(key);
          const error = errors[key];

          return (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 shadow-sm bg-white p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {g.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {g.count} línea(s) · {businessUnitName(g.businessUnitId)}
                    {g.suggestedScore !== null && (
                      <>
                        {" "}
                        · sugerido: {Math.round(g.suggestedScore * 100)}% de
                        similitud
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={value}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="min-w-[260px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">Sin producto seleccionado</option>
                  {candidates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.description}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleConfirm(g)}
                  disabled={isSaving || !value}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => handleNoMatch(g)}
                  disabled={isSaving}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Sin coincidencia
                </button>
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            No hay descripciones que coincidan con la búsqueda.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm text-slate-600">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
