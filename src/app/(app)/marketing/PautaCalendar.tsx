"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { AdCampaign } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { parseFlexibleNumber } from "@/lib/excel";
import { monthKeyOf, formatMonthLabel } from "@/lib/months";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import {
  createAdCampaign,
  deleteAdCampaign,
  updateAdCampaign,
  type AdCampaignInput,
} from "./pauta-actions";

type DraftCampaign = AdCampaignInput & { id: string; isDraft: true };
type Row = AdCampaign | DraftCampaign;

function isDraft(row: Row): row is DraftCampaign {
  return "isDraft" in row;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const reachFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatReach(value: number): string {
  return reachFormatter.format(value);
}

function durationDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

function emptyDraft(startDate: string): DraftCampaign {
  return {
    id: `draft-${crypto.randomUUID()}`,
    isDraft: true,
    campaign_name: "",
    investment_ars: 0,
    reach: 0,
    start_date: startDate,
    end_date: startDate,
  };
}

export default function PautaCalendar({
  initialCampaigns,
}: {
  initialCampaigns: AdCampaign[];
}) {
  const [rows, setRows] = useState<Row[]>(initialCampaigns);
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

  const groups = useMemo(() => {
    const byMonth = new Map<string, Row[]>();
    for (const row of rows) {
      const key = monthKeyOf(row.start_date);
      const list = byMonth.get(key) ?? [];
      list.push(row);
      byMonth.set(key, list);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, monthRows]) => ({
        monthKey,
        rows: [...monthRows].sort((a, b) =>
          a.start_date.localeCompare(b.start_date)
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

  async function saveField(row: AdCampaign, patch: Partial<AdCampaignInput>) {
    const nextStart = patch.start_date ?? row.start_date;
    const nextEnd = patch.end_date ?? row.end_date;
    if (nextEnd < nextStart) {
      setError(row.id, "La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setSaving(row.id, true);
    setError(row.id, null);
    const result = await updateAdCampaign(row.id, patch);
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
    patch: Partial<AdCampaignInput>
  ) {
    if (draft) {
      const nextStart = patch.start_date ?? row.start_date;
      const nextEnd = patch.end_date ?? row.end_date;
      if (nextEnd < nextStart) {
        setError(row.id, "La fecha de fin no puede ser anterior a la de inicio.");
        return;
      }
      setError(row.id, null);
      patchRow(row.id, patch as Partial<Row>);
    } else {
      saveField(row as AdCampaign, patch);
    }
  }

  async function saveDraft(draft: DraftCampaign) {
    if (!draft.campaign_name.trim()) {
      setError(draft.id, "El nombre de la campaña es obligatorio.");
      return;
    }
    if (draft.end_date < draft.start_date) {
      setError(draft.id, "La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setSaving(draft.id, true);
    setError(draft.id, null);

    const input: AdCampaignInput = {
      campaign_name: draft.campaign_name,
      investment_ars: draft.investment_ars,
      reach: draft.reach,
      start_date: draft.start_date,
      end_date: draft.end_date,
    };
    const result = await createAdCampaign(input);
    setSaving(draft.id, false);

    if (result.error) {
      setError(draft.id, result.error);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === draft.id ? (result.data as AdCampaign) : r))
    );
  }

  async function handleDelete(row: Row) {
    if (isDraft(row)) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(`¿Eliminar "${row.campaign_name}"?`)) return;

    setSaving(row.id, true);
    const result = await deleteAdCampaign(row.id);
    setSaving(row.id, false);

    if (result.error) {
      setError(row.id, result.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  function addDraftRow(startDate: string) {
    setRows((prev) => [...prev, emptyDraft(startDate)]);
  }

  function parseCurrencyInput(
    e: React.FocusEvent<HTMLInputElement>,
    current: number
  ): number | null {
    const value = parseFlexibleNumber(e.target.value);
    e.target.value = formatCurrency(value);
    return value === current ? null : value;
  }

  function parseReachInput(
    e: React.FocusEvent<HTMLInputElement>,
    current: number
  ): number | null {
    const value = parseFlexibleNumber(e.target.value);
    e.target.value = formatReach(value);
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
          Nueva campaña
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center text-sm text-mh-ink-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          Todavía no cargaste ninguna campaña de pauta.
        </div>
      ) : (
        groups.map(({ monthKey, rows: monthRows }) => {
          const totalInvestment = monthRows.reduce(
            (sum, r) => sum + r.investment_ars,
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
                      {monthRows.length} campaña(s) · Inversión total{" "}
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
                  + Agregar campaña
                </span>
              </button>

              {!collapsed && (
              <table className="text-xs" style={{ tableLayout: "fixed", width: "100%", minWidth: 1050 }}>
                <colgroup>
                  <col style={{ width: "auto" }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                    <th className="px-3 py-3">Campaña</th>
                    <th className="px-3 py-3">Inversión</th>
                    <th className="px-3 py-3">Alcance</th>
                    <th className="px-3 py-3">Inicio</th>
                    <th className="px-3 py-3">Fin</th>
                    <th className="px-3 py-3">Duración</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => {
                    const draft = isDraft(row);
                    const saving = savingIds.has(row.id);
                    const error = errors[row.id];
                    const days = durationDays(row.start_date, row.end_date);

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-mh-border/70 align-top last:border-0 hover:bg-mh-bg"
                      >
                        <td className="overflow-hidden px-3 py-3">
                          <AutoGrowTextarea
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
                            defaultValue={row.campaign_name}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === row.campaign_name) return;
                              applyChange(row, draft, { campaign_name: value });
                            }}
                          />
                          {error && (
                            <p className="mt-1 text-xs text-red-600">{error}</p>
                          )}
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
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full rounded border border-transparent px-1.5 py-1.5 text-right hover:border-mh-border focus:border-mh-pink focus:outline-none"
                            defaultValue={formatReach(row.reach)}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              const value = parseReachInput(e, row.reach);
                              if (value !== null)
                                applyChange(row, draft, { reach: value });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <input
                            type="date"
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
                            value={row.start_date}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!value || value === row.start_date) return;
                              applyChange(row, draft, { start_date: value });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <input
                            type="date"
                            className="w-full rounded border border-transparent px-1.5 py-1.5 hover:border-mh-border focus:border-mh-pink focus:outline-none"
                            value={row.end_date}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!value || value === row.end_date) return;
                              applyChange(row, draft, { end_date: value });
                            }}
                          />
                        </td>
                        <td className="overflow-hidden px-3 py-3 text-mh-ink-muted">
                          {days > 0 ? `${days} día(s)` : "—"}
                        </td>
                        <td className="overflow-hidden px-3 py-3">
                          <div className="flex items-center gap-2">
                            {draft && (
                              <button
                                onClick={() => saveDraft(row as DraftCampaign)}
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
