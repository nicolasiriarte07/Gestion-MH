"use client";

import { useMemo, useState } from "react";
import type { BusinessUnit, ContentType, MarketingPost } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import { monthKeyOf, formatMonthLabel } from "@/lib/months";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import {
  createMarketingPost,
  deleteMarketingPost,
  updateMarketingPost,
  type MarketingPostInput,
} from "./actions";

type DraftPost = MarketingPostInput & { id: string; isDraft: true };
type Row = MarketingPost | DraftPost;

function isDraft(row: Row): row is DraftPost {
  return "isDraft" in row;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const VERTICAL_COLORS: Record<string, string> = {
  "MUNDO HOGAR": "bg-brand-light text-brand-dark",
  "EQUIPAMIENTOS MH": "bg-violet-100 text-violet-700",
};

const CONTENT_LABELS: Record<ContentType, string> = {
  educacional: "Educacional",
  marca: "Marca",
  comercial: "Comercial",
};

const CONTENT_COLORS: Record<ContentType, string> = {
  educacional: "bg-blue-100 text-blue-700",
  marca: "bg-violet-100 text-violet-700",
  comercial: "bg-emerald-100 text-emerald-700",
};

function emptyDraft(publishDate: string): DraftPost {
  return {
    id: `draft-${crypto.randomUUID()}`,
    isDraft: true,
    concept: "",
    description: null,
    business_unit_id: null,
    publish_date: publishDate,
    content_type: null,
    is_scheduled: false,
    is_published: false,
    investment_ars: 0,
  };
}

export default function MarketingCalendar({
  initialPosts,
  businessUnits,
}: {
  initialPosts: MarketingPost[];
  businessUnits: BusinessUnit[];
}) {
  const [rows, setRows] = useState<Row[]>(initialPosts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const businessUnitName = useMemo(() => {
    const map = new Map(businessUnits.map((bu) => [bu.id, bu.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [businessUnits]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, Row[]>();
    for (const row of rows) {
      const key = monthKeyOf(row.publish_date);
      const list = byMonth.get(key) ?? [];
      list.push(row);
      byMonth.set(key, list);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, monthRows]) => ({
        monthKey,
        rows: [...monthRows].sort((a, b) =>
          a.publish_date.localeCompare(b.publish_date)
        ),
      }));
  }, [rows]);

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

  async function saveField(row: MarketingPost, patch: Partial<MarketingPostInput>) {
    setSaving(row.id, true);
    setError(row.id, null);
    const result = await updateMarketingPost(row.id, patch);
    setSaving(row.id, false);

    if (result.error) {
      setError(row.id, result.error);
      return;
    }
    patchRow(row.id, patch as Partial<Row>);
  }

  function applyChange(
    row: Row,
    draft: boolean,
    patch: Partial<MarketingPostInput>
  ) {
    if (draft) {
      patchRow(row.id, patch as Partial<Row>);
    } else {
      saveField(row as MarketingPost, patch);
    }
  }

  async function saveDraft(draft: DraftPost) {
    if (!draft.concept.trim()) {
      setError(draft.id, "El concepto es obligatorio.");
      return;
    }

    setSaving(draft.id, true);
    setError(draft.id, null);

    const input: MarketingPostInput = {
      concept: draft.concept,
      description: draft.description,
      business_unit_id: draft.business_unit_id,
      publish_date: draft.publish_date,
      content_type: draft.content_type,
      is_scheduled: draft.is_scheduled,
      is_published: draft.is_published,
      investment_ars: draft.investment_ars,
    };
    const result = await createMarketingPost(input);
    setSaving(draft.id, false);

    if (result.error) {
      setError(draft.id, result.error);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === draft.id ? (result.data as MarketingPost) : r))
    );
  }

  async function handleDelete(row: Row) {
    if (isDraft(row)) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(`¿Eliminar "${row.concept}"?`)) return;

    setSaving(row.id, true);
    const result = await deleteMarketingPost(row.id);
    setSaving(row.id, false);

    if (result.error) {
      setError(row.id, result.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  function addDraftRow(publishDate: string) {
    setRows((prev) => [...prev, emptyDraft(publishDate)]);
  }

  function parseCurrencyInput(
    e: React.FocusEvent<HTMLInputElement>,
    current: number
  ): number | null {
    const value = parseFlexibleNumber(e.target.value);
    e.target.value = formatCurrency(value);
    return value === current ? null : value;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => addDraftRow(todayISO())}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Nueva acción
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          Todavía no cargaste ninguna acción de comunicación.
        </div>
      ) : (
        groups.map(({ monthKey, rows: monthRows }) => {
          const totalInvestment = monthRows.reduce(
            (sum, r) => sum + (isDraft(r) ? r.investment_ars : r.investment_ars),
            0
          );

          return (
            <div
              key={monthKey}
              className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatMonthLabel(monthKey)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {monthRows.length} acción(es) · Inversión total{" "}
                    {formatCurrency(totalInvestment)}
                  </p>
                </div>
                <button
                  onClick={() => addDraftRow(`${monthKey}-01`)}
                  className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light"
                >
                  + Agregar acción
                </button>
              </div>

              <table className="text-xs" style={{ tableLayout: "fixed", width: "100%", minWidth: 1550 }}>
                <colgroup>
                  <col style={{ width: 220 }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: 190 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 font-medium">Concepto</th>
                    <th className="px-3 py-3 font-medium">Descripción</th>
                    <th className="px-3 py-3 font-medium">Vertical</th>
                    <th className="px-3 py-3 font-medium">Fecha</th>
                    <th className="px-3 py-3 font-medium">Contenido</th>
                    <th className="px-3 py-3 font-medium">Pautado</th>
                    <th className="px-3 py-3 font-medium">Publicado</th>
                    <th className="px-3 py-3 font-medium">Inversión</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => {
                    const draft = isDraft(row);
                    const saving = savingIds.has(row.id);
                    const error = errors[row.id];
                    const businessUnitLabel = businessUnitName(
                      row.business_unit_id
                    );

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50"
                      >
                        <td className="overflow-hidden px-3 py-3">
                          <AutoGrowTextarea
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-slate-300 focus:border-brand focus:outline-none"
                            defaultValue={row.concept}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === row.concept) return;
                              applyChange(row, draft, { concept: value });
                            }}
                          />
                          {error && (
                            <p className="mt-1 text-xs text-red-600">{error}</p>
                          )}
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <AutoGrowTextarea
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-slate-300 focus:border-brand focus:outline-none"
                            defaultValue={row.description ?? ""}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === (row.description ?? "")) return;
                              applyChange(row, draft, {
                                description: value || null,
                              });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <select
                            className={`w-full rounded border border-transparent px-1.5 py-1.5 hover:border-slate-300 focus:border-brand focus:outline-none ${
                              VERTICAL_COLORS[businessUnitLabel] ?? ""
                            }`}
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
                        <td className="overflow-hidden px-3 py-3">
                          <input
                            type="date"
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-slate-300 focus:border-brand focus:outline-none"
                            value={row.publish_date}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!value || value === row.publish_date) return;
                              applyChange(row, draft, { publish_date: value });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <select
                            className={`w-full rounded border border-transparent px-1.5 py-1.5 hover:border-slate-300 focus:border-brand focus:outline-none ${
                              row.content_type
                                ? CONTENT_COLORS[row.content_type]
                                : ""
                            }`}
                            value={row.content_type ?? ""}
                            onChange={(e) => {
                              applyChange(row, draft, {
                                content_type:
                                  (e.target.value as ContentType) || null,
                              });
                            }}
                          >
                            <option value="">Sin definir</option>
                            {(
                              Object.entries(CONTENT_LABELS) as [
                                ContentType,
                                string,
                              ][]
                            ).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="overflow-hidden px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            className="accent-brand"
                            checked={row.is_scheduled}
                            onChange={(e) => {
                              applyChange(row, draft, {
                                is_scheduled: e.target.checked,
                              });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            className="accent-brand"
                            checked={row.is_published}
                            onChange={(e) => {
                              applyChange(row, draft, {
                                is_published: e.target.checked,
                              });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full rounded border border-transparent px-1.5 py-1.5 text-right hover:border-slate-300 focus:border-brand focus:outline-none"
                            defaultValue={formatCurrency(row.investment_ars)}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              const value = parseCurrencyInput(
                                e,
                                row.investment_ars
                              );
                              if (value !== null)
                                applyChange(row, draft, {
                                  investment_ars: value,
                                });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <div className="flex items-center gap-2">
                            {draft && (
                              <button
                                onClick={() => saveDraft(row as DraftPost)}
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
