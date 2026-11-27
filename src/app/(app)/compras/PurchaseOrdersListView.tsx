"use client";

import { Download } from "lucide-react";
import Card from "@/components/ds/Card";
import Button from "@/components/ds/Button";
import { formatCurrency } from "@/lib/currency";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { STAGE_LABELS, formatDateDMY } from "./purchaseOrderStages";
import { paymentBalance, paymentStatus, PAYMENT_STATUS_LABELS } from "./paymentHelpers";

function toCsvValue(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(rows: PurchaseOrderRow[], brandName: (id: string | null) => string) {
  const header = [
    "Proveedor",
    "Productos",
    "Monto",
    "Condición de pago",
    "Estado de pago",
    "Fecha de pedido",
    "Fecha de llegada",
    "Etapa",
  ];
  const lines = rows.map((o) =>
    [
      brandName(o.brand_id),
      o.items.map((i) => `${i.product_description} x${i.quantity}`).join(" | "),
      o.totalAmount,
      o.payment_type,
      PAYMENT_STATUS_LABELS[paymentStatus(o.totalAmount, o.amount_paid)],
      o.order_date,
      o.arrival_date,
      STAGE_LABELS[o.estado],
    ]
      .map(toCsvValue)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos-compras-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PurchaseOrdersListView({
  rows,
  brandName,
}: {
  rows: PurchaseOrderRow[];
  brandName: (id: string | null) => string;
}) {
  return (
    <div className="font-inter space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportCsv(rows, brandName)}>
          Exportar CSV
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                <th className="px-3 py-3">Proveedor</th>
                <th className="px-3 py-3">Productos</th>
                <th className="px-3 py-3">Monto</th>
                <th className="px-3 py-3">Pago</th>
                <th className="px-3 py-3">Fecha pedido</th>
                <th className="px-3 py-3">Fecha llegada</th>
                <th className="px-3 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const status = paymentStatus(o.totalAmount, o.amount_paid);
                const balance = paymentBalance(o.totalAmount, o.amount_paid);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-mh-border/70 last:border-0 hover:bg-mh-bg"
                  >
                    <td className="px-3 py-3 font-semibold text-mh-ink">{brandName(o.brand_id)}</td>
                    <td className="max-w-xs truncate px-3 py-3 text-mh-ink-muted">
                      {o.items.length > 0
                        ? o.items.map((i) => `${i.product_description} x${i.quantity}`).join(", ")
                        : "Sin productos"}
                    </td>
                    <td className="tabular-nums-mh px-3 py-3 font-medium text-mh-ink">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-3 py-3 text-mh-ink-muted">
                      {o.payment_type ?? "—"} · {PAYMENT_STATUS_LABELS[status]}
                      {status === "parcial" && ` (saldo ${formatCurrency(balance)})`}
                    </td>
                    <td className="px-3 py-3 text-mh-ink-muted">{formatDateDMY(o.order_date)}</td>
                    <td className="px-3 py-3 text-mh-ink-muted">{formatDateDMY(o.arrival_date)}</td>
                    <td className="px-3 py-3 text-mh-ink-muted">{STAGE_LABELS[o.estado]}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-mh-ink-muted">
                    No hay pedidos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
