import { AlertTriangle, RefreshCw } from "lucide-react";
import Card from "@/components/ds/Card";
import type { TnSyncStatus } from "@/lib/types";

function formatDateDMY(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function StockRow({ row }: { row: TnSyncStatus }) {
  return (
    <div className="rounded-xl border border-mh-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-mh-ink">
            {row.producto ?? "Producto sin nombre"}
          </p>
          <p className="truncate text-xs text-mh-ink-muted">{row.sku ?? "—"}</p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-mh-ink-muted">
          Gestión {row.stock_gestion ?? "—"} · TN {row.stock_tn ?? "—"}
        </p>
      </div>
      {row.accion && <p className="mt-1 truncate text-xs text-mh-ink-muted">{row.accion}</p>}
    </div>
  );
}

export default function InicioStockTnCard({
  criticos,
  criticosCount,
  desincronizados,
  desincronizadosCount,
  stockBajoCount,
  latestDate,
  isStale,
}: {
  criticos: TnSyncStatus[];
  criticosCount: number;
  desincronizados: TnSyncStatus[];
  desincronizadosCount: number;
  stockBajoCount: number;
  latestDate: string | null;
  isStale: boolean;
}) {
  return (
    <Card className="font-inter">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-base font-bold text-mh-ink">Stock Tiendanube</h3>
      </div>

      {latestDate === null ? (
        <p className="py-6 text-center text-sm text-mh-ink-muted">
          Sin datos de sincronización todavía.
        </p>
      ) : (
        <>
          {isStale && (
            <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <RefreshCw size={13} />
              Último control: {formatDateDMY(latestDate)}
            </p>
          )}

          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-red-50 px-1.5 py-2 text-center">
              <p className="text-lg font-extrabold text-red-600">{criticosCount}</p>
              <p className="text-[11px] leading-tight font-semibold break-words text-red-600">
                Críticos
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 px-1.5 py-2 text-center">
              <p className="text-lg font-extrabold text-amber-700">{desincronizadosCount}</p>
              <p className="text-[11px] leading-tight font-semibold break-words text-amber-700">
                Desincronizados
              </p>
            </div>
            <div className="rounded-xl bg-mh-bg px-1.5 py-2 text-center">
              <p className="text-lg font-extrabold text-mh-ink">{stockBajoCount}</p>
              <p className="text-[11px] leading-tight font-semibold break-words text-mh-ink-muted">
                Stock bajo
              </p>
            </div>
          </div>

          {criticos.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-red-600 uppercase">
                <AlertTriangle size={12} />
                Críticos
              </p>
              <div className="space-y-1.5">
                {criticos.map((row) => (
                  <StockRow key={row.id} row={row} />
                ))}
              </div>
            </div>
          )}

          {desincronizados.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-amber-700 uppercase">Desincronizados</p>
              <div className="space-y-1.5">
                {desincronizados.map((row) => (
                  <StockRow key={row.id} row={row} />
                ))}
              </div>
            </div>
          )}

          {criticosCount === 0 && desincronizadosCount === 0 && (
            <p className="py-4 text-center text-sm text-mh-ink-muted">
              Sin críticos ni desincronizados. 🎉
            </p>
          )}
        </>
      )}
    </Card>
  );
}
