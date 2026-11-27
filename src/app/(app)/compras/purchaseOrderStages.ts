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

// Días entre dos fechas ISO (to - from). Positivo si "to" es posterior.
export function daysBetweenISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export type ArrivalLight = "verde" | "amarillo" | "rojo";

// null cuando no hay semáforo que mostrar: sin fecha de llegada
// cargada, o el pedido ya está en "Recibido" (no amerita alerta).
export function arrivalLight(
  order: { arrival_date: string | null; estado: PurchaseOrderEstado },
  today: string
): ArrivalLight | null {
  if (order.estado === "recibido" || !order.arrival_date) return null;
  const diff = daysBetweenISO(today, order.arrival_date);
  if (diff < 0) return "rojo";
  if (diff <= 3) return "amarillo";
  return "verde";
}

export const ARRIVAL_LIGHT_DOT_CLASSES: Record<ArrivalLight, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
};
