import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import Card from "@/components/ds/Card";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { EquipamientoContact } from "@/lib/types";
import {
  STAGE_LABELS,
  STAGE_TONE_CLASSES,
  formatDateDMY,
  suggestedWhatsAppMessage,
} from "./crm-equipamientos/contactStages";

function displayName(c: EquipamientoContact): string {
  const name = c.name.trim();
  if (name && name !== "-") return name;
  return c.business_name?.trim() || "Sin nombre";
}

export default function InicioSeguimientoCard({
  rows,
  totalCount,
}: {
  rows: EquipamientoContact[];
  totalCount: number;
}) {
  return (
    <Card className="font-inter">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-mh-ink">Seguimientos vencidos</h3>
          <span className="rounded-full bg-mh-pink-light px-2 py-0.5 text-xs font-extrabold text-mh-pink">
            {totalCount}
          </span>
        </div>
        <Link
          href="/crm-equipamientos"
          className="shrink-0 text-xs font-semibold text-mh-pink hover:text-mh-pink-dark"
        >
          Ver todos
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-mh-ink-muted">
          Sin seguimientos vencidos. 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl border border-mh-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-mh-ink">{displayName(c)}</p>
                  {c.city && (
                    <p className="flex items-center gap-1 truncate text-xs text-mh-ink-muted">
                      <MapPin size={11} />
                      {c.city}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${STAGE_TONE_CLASSES[c.etapa]}`}
                >
                  {STAGE_LABELS[c.etapa]}
                </span>
              </div>
              {c.equipo_interes && (
                <p className="mt-1 truncate text-xs text-mh-ink-muted">{c.equipo_interes}</p>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-red-600">
                  Vencido
                  {c.proximo_seguimiento ? ` · ${formatDateDMY(c.proximo_seguimiento)}` : ""}
                </span>
                {c.phone && (
                  <a
                    href={buildWhatsAppLink(c.phone, suggestedWhatsAppMessage(c))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
