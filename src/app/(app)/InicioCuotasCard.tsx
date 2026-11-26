"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import { outstandingBalance } from "@/lib/equipamientoSales";
import type { EquipamientoSale } from "@/lib/types";
import { updateSale } from "./ventas-equipamientos/actions";

export default function InicioCuotasCard({
  rows,
  totalCount,
}: {
  rows: EquipamientoSale[];
  totalCount: number;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleRegistrarPago(sale: EquipamientoSale) {
    if (!confirm(`¿Registrar el pago de la cuota de "${sale.cliente}" (${sale.producto})?`)) {
      return;
    }
    const nextSemanas = sale.semanas_pagadas + 1;
    const newBalance = sale.monto - sale.entrega_inicial - nextSemanas * (sale.cuota_semanal ?? 0);

    setSavingId(sale.id);
    const result = await updateSale(sale.id, {
      semanas_pagadas: nextSemanas,
      cobrado: newBalance <= 0,
    });
    setSavingId(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="font-inter">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-mh-ink">Cuotas de la semana</h3>
          <span className="rounded-full bg-mh-blue-light px-2 py-0.5 text-xs font-extrabold text-mh-blue">
            {totalCount}
          </span>
        </div>
        <Link
          href="/ventas-equipamientos"
          className="shrink-0 text-xs font-semibold text-mh-pink hover:text-mh-pink-dark"
        >
          Ver todos
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-mh-ink-muted">No hay cuotas pendientes.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((sale) => (
            <div key={sale.id} className="rounded-xl border border-mh-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-mh-ink">{sale.cliente}</p>
                  <p className="truncate text-xs text-mh-ink-muted">{sale.producto}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-mh-ink">
                  {formatCurrency(outstandingBalance(sale))}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-mh-ink-muted">
                  Cuota {formatCurrency(sale.cuota_semanal ?? 0)} · {sale.semanas_pagadas} sem.
                  pagadas
                </span>
                <button
                  onClick={() => handleRegistrarPago(sale)}
                  disabled={savingId === sale.id}
                  className="shrink-0 rounded-lg bg-mh-pink px-2.5 py-1 text-xs font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
                >
                  {savingId === sale.id ? "..." : "Registrar pago"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
