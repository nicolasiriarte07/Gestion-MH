"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import Card from "@/components/ds/Card";
import Badge, { type BadgeTone } from "@/components/ds/Badge";
import { formatCurrency } from "@/lib/currency";
import type { EquipamientoContact, EquipamientoSale } from "@/lib/types";
import { linkSaleToContact } from "../actions";
import { matchContactForSale, type MatchLevel } from "../contactMatching";
import ContactPicker from "../ContactPicker";

const LEVEL_LABELS: Record<MatchLevel, string> = {
  exacta: "Exacta",
  parecida: "Parecida",
  sin_match: "Sin match",
};

const LEVEL_TONES: Record<MatchLevel, BadgeTone> = {
  exacta: "green",
  parecida: "amber",
  sin_match: "gray",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Override = { contact: EquipamientoContact | null; query: string };

// Para cada venta sin contact_id todavía, propone el contacto que mejor
// coincide (ver contactMatching.ts). No aplica nada solo: cada fila se
// confirma a mano con "Vincular", o en bloque con el botón de arriba
// (solo para las de coincidencia exacta).
export default function VincularVentasView({
  initialSales,
  contacts,
}: {
  initialSales: EquipamientoSale[];
  contacts: EquipamientoContact[];
}) {
  const router = useRouter();
  const [sales, setSales] = useState<EquipamientoSale[]>(initialSales);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [bulkLinking, setBulkLinking] = useState(false);

  const rows = useMemo(
    () =>
      sales.map((sale) => {
        const match = matchContactForSale(sale, contacts);
        const override = overrides[sale.id];
        return {
          sale,
          level: match.level,
          contact: override ? override.contact : match.contact,
          query: override ? override.query : (match.contact?.name ?? sale.cliente),
        };
      }),
    [sales, contacts, overrides]
  );

  const exactRows = rows.filter((r) => r.level === "exacta" && r.contact);

  async function handleLink(saleId: string, contact: EquipamientoContact) {
    setLinkingId(saleId);
    const result = await linkSaleToContact(saleId, contact.id);
    setLinkingId(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    router.refresh();
  }

  async function handleBulkLinkExact() {
    if (exactRows.length === 0) return;
    if (!confirm(`¿Vincular las ${exactRows.length} ventas con coincidencia exacta?`)) return;

    setBulkLinking(true);
    const results = await Promise.all(
      exactRows.map((r) => linkSaleToContact(r.sale.id, r.contact!.id))
    );
    setBulkLinking(false);

    const failed = results.filter((r) => r.error).length;
    const linkedIds = new Set(exactRows.map((r) => r.sale.id));
    setSales((prev) => prev.filter((s) => !linkedIds.has(s.id)));
    router.refresh();
    if (failed > 0) alert(`${failed} venta(s) no se pudieron vincular.`);
  }

  return (
    <div className="font-inter space-y-6">
      <div>
        <Link
          href="/ventas-equipamientos"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
        >
          <ArrowLeft size={15} />
          Volver a Ventas
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
          Vincular ventas a contactos
        </h1>
        <p className="mt-1 text-sm font-medium text-mh-ink-muted">
          Ventas sin contacto vinculado, con el contacto que mejor coincide según el cliente/
          comercio escrito. Podés cambiar el contacto propuesto en cualquier fila antes de
          confirmar.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center text-sm text-mh-ink-muted">
          No quedan ventas sin vincular.
        </div>
      ) : (
        <>
          {exactRows.length > 0 && (
            <button
              onClick={handleBulkLinkExact}
              disabled={bulkLinking}
              className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
            >
              <Check size={16} />
              {bulkLinking
                ? "Vinculando..."
                : `Vincular las ${exactRows.length} coincidencias exactas`}
            </button>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-sm">
                <thead>
                  <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-3 py-3">Cliente escrito</th>
                    <th className="px-3 py-3">Comercio escrito</th>
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">Monto</th>
                    <th className="px-3 py-3">Nivel</th>
                    <th className="px-3 py-3">Contacto propuesto</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ sale, level, contact, query }) => (
                    <tr key={sale.id} className="border-b border-mh-border/70 last:border-0">
                      <td className="px-4 py-3 text-mh-ink-muted">{formatDate(sale.fecha)}</td>
                      <td className="px-3 py-3 font-semibold text-mh-ink">{sale.cliente}</td>
                      <td className="px-3 py-3 text-mh-ink-muted">{sale.comercio ?? "—"}</td>
                      <td className="px-3 py-3 text-mh-ink-muted">{sale.producto}</td>
                      <td className="px-3 py-3 font-semibold text-mh-ink">
                        {formatCurrency(sale.monto)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={LEVEL_TONES[level]}>{LEVEL_LABELS[level]}</Badge>
                      </td>
                      <td className="min-w-[260px] px-3 py-3">
                        <ContactPicker
                          contacts={contacts}
                          contactId={contact?.id ?? null}
                          displayName={query}
                          onChangeDisplayName={(name) =>
                            setOverrides((prev) => ({
                              ...prev,
                              [sale.id]: { contact: null, query: name },
                            }))
                          }
                          onSelectContact={(c) =>
                            setOverrides((prev) => ({
                              ...prev,
                              [sale.id]: { contact: c, query: c.name },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => contact && handleLink(sale.id, contact)}
                          disabled={!contact || linkingId === sale.id}
                          className="rounded-lg bg-mh-pink px-3 py-1.5 text-xs font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-40"
                        >
                          {linkingId === sale.id ? "..." : "Vincular"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
