import type { AdCampaign, MarketingPost } from "@/lib/types";
import type { BadgeTone } from "@/components/ds/Badge";

// No hay una tabla de "campañas de marketing" única: son dos entidades
// reales y separadas (marketing_posts = Orgánico, ad_campaigns = Pauta).
// Este archivo las unifica SOLO para poder mostrarlas juntas en las
// vistas nuevas (Calendario/Agenda/Kanban/panel/dashboard) sin tocar sus
// tablas, columnas ni mutaciones — cada item guarda su dato original
// (`data`) y accede a través de estos helpers.
export type MarketingItem =
  | { kind: "post"; data: MarketingPost }
  | { kind: "campaign"; data: AdCampaign };

export function itemId(item: MarketingItem): string {
  return item.data.id;
}

export function itemTitle(item: MarketingItem): string {
  return item.kind === "post" ? item.data.concept : item.data.campaign_name;
}

export function itemStartDate(item: MarketingItem): string {
  return item.kind === "post" ? item.data.publish_date : item.data.start_date;
}

export function itemEndDate(item: MarketingItem): string {
  return item.kind === "post" ? item.data.publish_date : item.data.end_date;
}

export function itemInvestment(item: MarketingItem): number {
  return item.data.investment_ars;
}

// Estado: no existe una columna "estado" en ninguna de las dos tablas.
// Se deriva de datos reales — is_published para Orgánico (más preciso
// que solo la fecha: si ya se marcó publicado, está finalizada aunque
// la fecha sea hoy) y start/end_date para Pauta (no tiene esos
// checkboxes). "Pausada" no se incluye: no hay ningún campo que
// indique una pausa manual en ninguna de las dos tablas.
export type MarketingStatus = "programada" | "en_curso" | "finalizada";

export function itemStatus(item: MarketingItem, todayISO: string): MarketingStatus {
  if (item.kind === "post") {
    if (item.data.is_published) return "finalizada";
    return todayISO < item.data.publish_date ? "programada" : "en_curso";
  }
  if (todayISO < item.data.start_date) return "programada";
  if (todayISO > item.data.end_date) return "finalizada";
  return "en_curso";
}

const STATUS_LABELS: Record<MarketingStatus, string> = {
  programada: "Programada",
  en_curso: "En curso",
  finalizada: "Finalizada",
};

const STATUS_TONES: Record<MarketingStatus, BadgeTone> = {
  programada: "blue",
  en_curso: "green",
  finalizada: "gray",
};

export function statusLabel(status: MarketingStatus): string {
  return STATUS_LABELS[status];
}

export function statusTone(status: MarketingStatus): BadgeTone {
  return STATUS_TONES[status];
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
