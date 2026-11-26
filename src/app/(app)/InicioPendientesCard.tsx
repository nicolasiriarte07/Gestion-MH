"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ds/Card";
import { formatCurrency } from "@/lib/currency";
import type { EquipamientoSale } from "@/lib/types";
import { updateSale } from "./ventas-equipamientos/actions";

function formatDateDMY(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Tab = "cobrar" | "entregar";

export default function InicioPendientesCard({
  porCobrar,
  porCobrarCount,
  porEntregar,
  porEntregarCount,
}: {
  porCobrar: EquipamientoSale[];
  porCobrarCount: number;
  porEntregar: EquipamientoSale[];
  porEntregarCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("cobrar");
  const [savingId, setSavingId] = useState<string | null>(null);

  const rows = tab === "cobrar" ? porCobrar : porEntregar;
  const actionLabel = tab === "cobrar" ? "Marcar cobrado" : "Marcar entregado";

  async function handleMark(sale: EquipamientoSale) {
    const label = tab === "cobrar" ? "cobrada" : "entregada";
    if (!confirm(`¿Marcar la venta de "${sale.cliente}" (${sale.producto}) como ${label}?`)) {
      return;
    }
    setSavingId(sale.id);
    const result = await updateSale(
      sale.id,
      tab === "cobrar" ? { cobrado: true } : { entregado: true }
    );
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
          <h3 className="text-base font-bold text-mh-ink">Pendientes de cobrar o entregar</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-700">
            {porCobrarCount + porEntregarCount}
          </span>
        </div>
        <Link
          href="/ventas-equipamientos"
          className="shrink-0 text-xs font-semibold text-mh-pink hover:text-mh-pink-dark"
        >
          Ver todos
        </Link>
      </div>

      <div className="mb-3 inline-flex gap-1 rounded-xl border border-mh-border bg-mh-bg p-1">
        <button
          onClick={() => setTab("cobrar")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "cobrar" ? "bg-white text-mh-ink shadow-sm" : "text-mh-ink-muted"
          }`}
        >
          Por cobrar ({porCobrarCount})
        </button>
        <button
          onClick={() => setTab("entregar")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "entregar" ? "bg-white text-mh-ink shadow-sm" : "text-mh-ink-muted"
          }`}
        >
          Por entregar ({porEntregarCount})
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-mh-ink-muted">Nada pendiente acá. 🎉</p>
      ) : (
        <div className="space-y-2">
          {rows.map((sale) => (
            <div key={sale.id} className="rounded-xl border border-mh-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-mh-ink">{sale.cliente}</p>
                  <p className="truncate text-xs text-mh-ink-muted">
                    {sale.producto} · {formatDateDMY(sale.fecha)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-mh-ink">
                  {formatCurrency(sale.monto)}
                </p>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => handleMark(sale)}
                  disabled={savingId === sale.id}
                  className="rounded-lg bg-mh-pink px-2.5 py-1 text-xs font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
                >
                  {savingId === sale.id ? "..." : actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
