// Sin "use client"/"use server": helpers puros de fecha, usables tanto
// desde page.tsx (server) como desde los componentes de cliente de este
// módulo.

const FOLLOW_UP_STALE_DAYS = 15;

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

function daysBetweenISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// Un contacto "toca hoy" si:
// - tiene próximo_seguimiento cargado y es hoy o ya pasó, o
// - no tiene próximo_seguimiento y hace 15 días o más que no se lo
//   contacta (o nunca se lo contactó).
export function needsFollowUpToday(
  contact: { proximo_seguimiento: string | null; last_contact_date: string | null },
  today: string
): boolean {
  if (contact.proximo_seguimiento) {
    return contact.proximo_seguimiento <= today;
  }
  if (!contact.last_contact_date) return true;
  return daysBetweenISO(contact.last_contact_date, today) >= FOLLOW_UP_STALE_DAYS;
}
