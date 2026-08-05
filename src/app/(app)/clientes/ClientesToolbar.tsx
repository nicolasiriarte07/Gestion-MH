"use client";

import Link from "next/link";
import { Plus, Download, Upload, Printer, Megaphone } from "lucide-react";
import type { ClienteTableRow } from "./ClientesTable";

const buttonClass =
  "flex items-center gap-1.5 rounded-xl border border-mh-border bg-white px-3.5 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

function toCsvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(rows: ClienteTableRow[]) {
  const header = [
    "Cliente",
    "Cliente desde",
    "Última compra",
    "Compras",
    "Facturación ARS",
    "Facturación USD",
    "Ticket promedio",
    "Estado",
  ];
  const lines = rows.map((r) =>
    [
      r.customer_name,
      r.first_sale_date,
      r.last_sale_date,
      r.visit_count,
      r.total_ars,
      r.total_usd,
      r.line_count > 0 ? Math.round(r.total_ars / r.line_count) : 0,
      r.status,
    ]
      .map(toCsvValue)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// "Nueva venta" y "Enviar campaña" quedan deshabilitados: no existe una
// carga manual de una venta puntual (las ventas solo entran por
// importación masiva) ni un sistema de campañas dirigidas a clientes.
// "Importar" lleva a la importación de ventas real: es la única forma
// en la que un cliente nuevo entra al sistema.
export default function ClientesToolbar({
  selectedRows,
  allRows,
}: {
  selectedRows: ClienteTableRow[];
  allRows: ClienteTableRow[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={buttonClass} disabled title="Próximamente: no existe una carga manual de una venta puntual">
        <Plus size={16} />
        Nueva venta
      </button>
      <button
        className={buttonClass}
        onClick={() => exportCsv(selectedRows.length > 0 ? selectedRows : allRows)}
      >
        <Download size={16} />
        Exportar{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
      </button>
      <Link href="/ventas/import" className={buttonClass}>
        <Upload size={16} />
        Importar
      </Link>
      <button className={buttonClass} onClick={() => window.print()}>
        <Printer size={16} />
        Imprimir
      </button>
      <button className={buttonClass} disabled title="Próximamente">
        <Megaphone size={16} />
        Enviar campaña
      </button>
    </div>
  );
}
