import type { PurchaseOrderEstado } from "@/lib/types";

export const STAGE_LABELS: Record<PurchaseOrderEstado, string> = {
  pedido: "Pedido",
  confirmado: "Confirmado",
  en_camino: "En camino",
  recibido: "Recibido",
};

export const COLUMN_HEADER_CLASSES: Record<PurchaseOrderEstado, string> = {
  pedido: "bg-slate-100 text-slate-700",
  confirmado: "bg-mh-blue-light text-mh-blue",
  en_camino: "bg-amber-100 text-amber-700",
  recibido: "bg-emerald-100 text-emerald-700",
};

export function formatDateDMY(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
