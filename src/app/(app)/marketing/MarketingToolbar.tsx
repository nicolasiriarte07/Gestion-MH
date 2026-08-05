"use client";

import { useState } from "react";
import { Plus, Sparkles, Tag, CheckSquare, Upload, Download } from "lucide-react";
import type { BusinessUnit } from "@/lib/types";
import MarketingQuickCreateModal from "./MarketingQuickCreateModal";
import { itemTitle, itemStartDate, itemEndDate, itemInvestment, itemStatus, statusLabel, todayISO, type MarketingItem } from "./normalize";

const buttonClass =
  "flex items-center gap-1.5 rounded-xl border border-mh-border bg-white px-3.5 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

function toCsvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(items: MarketingItem[]) {
  const today = todayISO();
  const header = ["Tipo", "Nombre", "Inicio", "Fin", "Inversión", "Estado"];
  const lines = items.map((item) =>
    [
      item.kind === "post" ? "Orgánico" : "Pauta",
      itemTitle(item),
      itemStartDate(item),
      itemEndDate(item),
      itemInvestment(item),
      statusLabel(itemStatus(item, today)),
    ]
      .map(toCsvValue)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketing-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// "Nueva promoción" y "Nueva tarea" quedan deshabilitadas: no existe
// ninguna de las dos entidades en la base (Descuentos es un módulo
// aparte, y no hay una tabla de tareas). "Importar calendario" también
// queda deshabilitado: no hay un formato de importación definido para
// posts/campañas (a diferencia de Ventas/Inventario, que sí importan
// desde Excel).
export default function MarketingToolbar({
  items,
  businessUnits,
}: {
  items: MarketingItem[];
  businessUnits: BusinessUnit[];
}) {
  const [creating, setCreating] = useState<"post" | "campaign" | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClass} onClick={() => setCreating("campaign")}>
          <Plus size={16} />
          Nueva campaña
        </button>
        <button className={buttonClass} onClick={() => setCreating("post")}>
          <Sparkles size={16} />
          Nueva publicación
        </button>
        <button className={buttonClass} disabled title="Próximamente: Descuentos es un módulo aparte">
          <Tag size={16} />
          Nueva promoción
        </button>
        <button className={buttonClass} disabled title="Próximamente: no existe una entidad de tareas">
          <CheckSquare size={16} />
          Nueva tarea
        </button>
        <button className={buttonClass} disabled title="Próximamente">
          <Upload size={16} />
          Importar calendario
        </button>
        <button className={buttonClass} onClick={() => exportCsv(items)}>
          <Download size={16} />
          Exportar
        </button>
      </div>

      {creating && (
        <MarketingQuickCreateModal
          kind={creating}
          businessUnits={businessUnits}
          onClose={() => setCreating(null)}
        />
      )}
    </>
  );
}
