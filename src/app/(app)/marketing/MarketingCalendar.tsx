"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { BusinessUnit, ContentType, MarketingPost } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import { monthKeyOf, formatMonthLabel } from "@/lib/months";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import { CONTENT_LABELS, CONTENT_TONE_CLASSES, VERTICAL_TONE_CLASSES } from "./marketingLabels";
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
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set()
  );

  function toggleMonth(monthKey: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  }

  function expandMonth(monthKey: string) {
    setCollapsedMonths((prev) => {
      if (!prev.has(monthKey)) return prev;
      const next = new Set(prev);
      next.delete(monthKey);
      return next;
    });
  }

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
    <div className="font-inter space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => addDraftRow(todayISO())}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
        >
          <Plus size={16} />
          Nueva acción
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center text-sm text-mh-ink-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          Todavía no cargaste ninguna acción de comunicación.
        </div>
      ) : (
        groups.map(({ monthKey, rows: monthRows }) => {
          const totalInvestment = monthRows.reduce(
            (sum, r) => sum + (isDraft(r) ? r.investment_ars : r.investment_ars),
            0
          );
          const collapsed = collapsedMonths.has(monthKey);

          return (
            <div
              key={monthKey}
              className="overflow-x-auto rounded-2xl border border-mh-border bg-mh-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <button
                onClick={() => toggleMonth(monthKey)}
                className="flex w-full items-center justify-between gap-3 border-b border-mh-border px-4 py-3 text-left hover:bg-mh-bg"
              >
                <div className="flex items-center gap-2">
                  {collapsed ? (
                    <ChevronRight size={16} className="shrink-0 text-mh-ink-muted" />
                  ) : (
                    <ChevronDown size={16} className="shrink-0 text-mh-ink-muted" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-mh-ink">
                      {formatMonthLabel(monthKey)}
                    </p>
                    <p className="text-xs text-mh-ink-muted">
                      {monthRows.length} acción(es) · Inversión total{" "}
                      {formatCurrency(totalInvestment)}
                    </p>
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    addDraftRow(`${monthKey}-01`);
                    expandMonth(monthKey);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      addDraftRow(`${monthKey}-01`);
                      expandMonth(monthKey);
                    }
                  }}
                  className="shrink-0 rounded-lg border border-mh-pink px-3 py-1.5 text-xs font-semibold text-mh-pink hover:bg-mh-pink-light"
                >
                  + Agregar acción
                </span>
              </button>

              {!collapsed && (
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
                  <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                    <th className="px-3 py-3">Concepto</th>
                    <th className="px-3 py-3">Descripción</th>
                    <th className="px-3 py-3">Vertical</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Contenido</th>
                    <th className="px-3 py-3">Pautado</th>
                    <th className="px-3 py-3">Publicado</th>
                    <th className="px-3 py-3">Inversión</th>
                    <th className="px-3 py-3" />
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
                        className="border-b border-mh-border/70 align-top last:border-0 hover:bg-mh-bg"
                      >
                        <td className="overflow-hidden px-3 py-3">
                          <AutoGrowTextarea
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
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
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
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
                            className={`w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none ${
                              VERTICAL_TONE_CLASSES[businessUnitLabel] ?? ""
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
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
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
                            className={`w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none ${
                              row.content_type
                                ? CONTENT_TONE_CLASSES[row.content_type]
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
                            className="accent-mh-pink"
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
                            className="accent-mh-pink"
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
                            className="w-full rounded border border-transparent px-1.5 py-1.5 text-right hover:border-mh-border focus:border-mh-pink focus:outline-none"
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
                                className="rounded-lg bg-mh-pink px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
                              >
                                {saving ? "..." : "Guardar"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(row)}
                              disabled={saving}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
