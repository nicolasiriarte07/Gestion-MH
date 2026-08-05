"use client";

import { useMemo, useState } from "react";
import { ShoppingBag, CreditCard, Download, Upload, Printer } from "lucide-react";
import Modal from "@/components/Modal";
import LedgerEntryModal from "./LedgerEntryModal";
import type { SupplierRow } from "./SuppliersTable";

const buttonClass =
  "flex items-center gap-1.5 rounded-xl border border-mh-border bg-white px-3.5 py-2.5 text-sm font-semibold text-mh-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

function toCsvValue(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(rows: SupplierRow[]) {
  const header = [
    "Nombre",
    "Razón social",
    "CUIT",
    "Categoría",
    "Ciudad",
    "Teléfono",
    "Email",
    "Saldo pendiente",
    "Última compra",
    "Estado",
  ];
  const lines = rows.map((r) =>
    [
      r.trade_name,
      r.legal_name,
      r.cuit,
      r.category,
      r.city,
      r.phone,
      r.email,
      r.balance,
      r.last_purchase_date,
      r.is_active ? "Activo" : "Inactivo",
    ]
      .map(toCsvValue)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proveedores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProveedoresToolbar({ rows }: { rows: SupplierRow[] }) {
  const [pickerKind, setPickerKind] = useState<"compra" | "pago" | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [chosen, setChosen] = useState<{ id: string; name: string } | null>(null);

  const filteredSuppliers = useMemo(() => {
    const needle = pickerSearch.trim().toLowerCase();
    const active = rows.filter((r) => r.is_active);
    if (!needle) return active.slice(0, 30);
    return active
      .filter((r) => r.trade_name.toLowerCase().includes(needle))
      .slice(0, 30);
  }, [rows, pickerSearch]);

  function openPicker(kind: "compra" | "pago") {
    setPickerKind(kind);
    setPickerSearch("");
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClass} onClick={() => openPicker("compra")}>
          <ShoppingBag size={16} />
          Nueva compra
        </button>
        <button className={buttonClass} onClick={() => openPicker("pago")}>
          <CreditCard size={16} />
          Registrar pago
        </button>
        <button className={buttonClass} onClick={() => exportCsv(rows)}>
          <Download size={16} />
          Exportar
        </button>
        <button className={buttonClass} disabled title="Próximamente">
          <Upload size={16} />
          Importar
        </button>
        <button className={buttonClass} onClick={() => window.print()}>
          <Printer size={16} />
          Imprimir
        </button>
      </div>

      {pickerKind && !chosen && (
        <Modal
          title={pickerKind === "compra" ? "Nueva compra: elegí un proveedor" : "Registrar pago: elegí un proveedor"}
          onClose={() => setPickerKind(null)}
        >
          <input
            autoFocus
            type="text"
            placeholder="Buscar proveedor..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="font-inter mb-3 w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredSuppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => setChosen({ id: s.id, name: s.trade_name })}
                className="font-inter flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-mh-ink hover:bg-slate-50"
              >
                {s.trade_name}
              </button>
            ))}
            {filteredSuppliers.length === 0 && (
              <p className="font-inter px-2 py-4 text-center text-sm text-mh-ink-muted">
                No se encontraron proveedores activos.
              </p>
            )}
          </div>
        </Modal>
      )}

      {pickerKind && chosen && (
        <LedgerEntryModal
          supplierId={chosen.id}
          supplierName={chosen.name}
          kind={pickerKind}
          onClose={() => {
            setPickerKind(null);
            setChosen(null);
          }}
        />
      )}
    </>
  );
}
