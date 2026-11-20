"use client";

import { Search, X } from "lucide-react";
import { CONTACT_CATEGORIES, CONTACT_STAGES, type ContactCategory, type ContactStage } from "@/lib/types";
import { STAGE_LABELS } from "./contactStages";

const selectClass =
  "font-inter rounded-xl border border-mh-border bg-white px-3 py-2.5 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none";

export default function ContactFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  stage,
  onStageChange,
  dueToday,
  onDueTodayChange,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: ContactCategory | "";
  onCategoryChange: (v: ContactCategory | "") => void;
  stage: ContactStage | "";
  onStageChange: (v: ContactStage | "") => void;
  dueToday: boolean;
  onDueTodayChange: (v: boolean) => void;
  onClear: () => void;
}) {
  const hasFilters = search !== "" || category !== "" || stage !== "" || dueToday;

  return (
    <div className="font-inter flex flex-wrap items-center gap-3 rounded-2xl border border-mh-border bg-mh-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-[240px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mh-ink-muted"
        />
        <input
          type="text"
          placeholder="Buscar por nombre, comercio o ciudad..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-inter w-full rounded-xl border border-mh-border bg-white py-2.5 pr-3 pl-9 text-sm font-medium text-mh-ink focus:border-mh-pink focus:outline-none"
        />
      </div>

      <select
        value={stage}
        onChange={(e) => onStageChange(e.target.value as ContactStage | "")}
        className={selectClass}
      >
        <option value="">Etapa: todas</option>
        {CONTACT_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as ContactCategory | "")}
        className={selectClass}
      >
        <option value="">Rubro: todos</option>
        {CONTACT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        onClick={() => onDueTodayChange(!dueToday)}
        className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
          dueToday
            ? "border-mh-pink bg-mh-pink text-white"
            : "border-mh-border bg-white text-mh-ink-muted hover:text-mh-ink"
        }`}
      >
        Toca seguimiento hoy
      </button>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
