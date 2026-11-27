// Sin "use client"/"use server": helpers puros de fecha, usables tanto
// desde page.tsx (server) como desde los componentes de cliente de este
// módulo.

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// Para el rojo de "vencido" en tarjetas/tablas: estrictamente antes de
// hoy (hoy todavía no es "vencido", es "para hoy").
export function isOverdue(
  contact: { proximo_seguimiento: string | null },
  today: string
): boolean {
  return !!contact.proximo_seguimiento && contact.proximo_seguimiento < today;
}

// Franja "Para contactar esta semana": próximo_seguimiento vencido o
// dentro de los próximos 7 días (incluye hoy). Contactos sin fecha
// cargada no entran acá.
export function needsFollowUpThisWeek(
  contact: { proximo_seguimiento: string | null },
  today: string
): boolean {
  if (!contact.proximo_seguimiento) return false;
  return contact.proximo_seguimiento <= addDaysISO(today, 7);
}

export type FollowUpLight = "verde" | "amarillo" | "rojo";

// Semáforo del próximo seguimiento (mismo criterio que arrivalLight en
// Compras): sin fecha cargada no hay semáforo que mostrar.
export function followUpLight(
  contact: { proximo_seguimiento: string | null },
  today: string
): FollowUpLight | null {
  if (!contact.proximo_seguimiento) return null;
  const diff = daysBetweenISO(today, contact.proximo_seguimiento);
  if (diff < 0) return "rojo";
  if (diff <= 3) return "amarillo";
  return "verde";
}

export const FOLLOW_UP_LIGHT_DOT_CLASSES: Record<FollowUpLight, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
};
