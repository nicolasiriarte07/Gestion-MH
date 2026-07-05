// Rango del mes calendario anterior completo (ej. si hoy es cualquier día
// de julio, devuelve junio entero), en formato ISO (YYYY-MM-DD).
export function previousMonthRange(): { from: string; to: string } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const firstOfThisMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth - 1);
  const firstOfPrevMonth = new Date(
    Date.UTC(lastOfPrevMonth.getUTCFullYear(), lastOfPrevMonth.getUTCMonth(), 1)
  );
  return { from: toISO(firstOfPrevMonth), to: toISO(lastOfPrevMonth) };
}
