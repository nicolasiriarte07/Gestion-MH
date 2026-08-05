import { Megaphone } from "lucide-react";
import Card from "@/components/ds/Card";
import Donut, { type DonutRow } from "@/components/ds/Donut";
import { itemTitle, itemStartDate, todayISO, type MarketingItem } from "./normalize";

export type MonthlyPerformanceRow = {
  monthLabel: string;
  campaigns: number;
  posts: number;
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

// Barras de 2 series (campañas/publicaciones) por mes: no hay un
// componente ds/ genérico para esto (MiniBarChart solo soporta una
// serie), así que se arma acá mismo, reusando la misma paleta fija
// rosa=Orgánico / azul=Pauta del resto del módulo.
function PerformanceBars({ rows }: { rows: MonthlyPerformanceRow[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.campaigns, r.posts]));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs font-semibold text-mh-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-mh-blue" /> Campañas ejecutadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-mh-pink" /> Publicaciones realizadas
        </span>
      </div>
      <div className="flex items-end gap-3" style={{ height: 140 + 24 }}>
        {rows.map((r) => (
          <div key={r.monthLabel} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-md bg-mh-blue"
                style={{ height: Math.max(4, (r.campaigns / max) * 140) }}
                title={`${r.campaigns} campaña(s)`}
              />
              <div
                className="w-1/2 rounded-md bg-mh-pink"
                style={{ height: Math.max(4, (r.posts / max) * 140) }}
                title={`${r.posts} publicación(es)`}
              />
            </div>
            <span className="text-[11px] font-medium text-mh-ink-muted">{r.monthLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingBottomDashboard({
  campaignStatusRows,
  upcomingActions,
  monthlyPerformance,
}: {
  campaignStatusRows: DonutRow[];
  upcomingActions: MarketingItem[];
  monthlyPerformance: MonthlyPerformanceRow[];
}) {
  const today = todayISO();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Campañas por canal</p>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Megaphone size={24} className="text-slate-300" />
          <p className="max-w-[28ch] text-sm text-mh-ink-muted">
            No hay un canal (Instagram, Facebook, Google, Email, WhatsApp) cargado por campaña
            o publicación en el sistema.
          </p>
        </div>
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Estado de campañas</p>
        <Donut rows={campaignStatusRows} formatValue={(v) => `${v} campaña(s)`} />
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Próximas acciones</p>
        {upcomingActions.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">No hay próximas acciones cargadas.</p>
        ) : (
          <ol className="space-y-4 border-l-2 border-mh-border pl-4">
            {upcomingActions.map((item) => (
              <li key={`${item.kind}-${item.data.id}`} className="relative">
                <span
                  className={`absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full ${
                    item.kind === "post" ? "bg-mh-pink" : "bg-mh-blue"
                  }`}
                />
                <p className="text-sm font-medium text-mh-ink">
                  <span className="font-bold">{itemTitle(item)}</span> ·{" "}
                  {item.kind === "post" ? "Publicación" : "Campaña"}
                </p>
                <p className="text-xs text-mh-ink-muted">
                  {formatDate(itemStartDate(item))}
                  {itemStartDate(item) === today ? " · Hoy" : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Rendimiento mensual</p>
        <PerformanceBars rows={monthlyPerformance} />
      </Card>
    </div>
  );
}
