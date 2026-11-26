function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const formatted = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export default function InicioHoySummary({
  todayISO,
  seguimientoCount,
  cuotasCount,
  sinEntregarCount,
  criticosCount,
}: {
  todayISO: string;
  seguimientoCount: number;
  cuotasCount: number;
  sinEntregarCount: number;
  criticosCount: number;
}) {
  return (
    <div className="font-inter flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="font-extrabold text-mh-ink">{formatLongDate(todayISO)}</span>
      <span className="text-mh-ink-muted">
        · {seguimientoCount} {plural(seguimientoCount, "seguimiento", "seguimientos")} ·{" "}
        {cuotasCount} {plural(cuotasCount, "cuota", "cuotas")} · {sinEntregarCount} sin entregar ·{" "}
        {criticosCount} {plural(criticosCount, "crítico", "críticos")}
      </span>
    </div>
  );
}
