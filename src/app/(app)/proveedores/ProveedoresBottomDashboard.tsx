import Card from "@/components/ds/Card";
import BarList from "@/components/ds/BarList";
import { formatCurrency } from "@/lib/currency";

export type PendingBalanceRow = {
  id: string;
  trade_name: string;
  balance: number;
  last_purchase_date: string | null;
};

export type MovementRow = {
  id: string;
  supplierName: string;
  description: string;
  occurred_at: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProveedoresBottomDashboard({
  topSuppliers,
  byCategory,
  pendingBalances,
  movements,
}: {
  topSuppliers: { label: string; value: number }[];
  byCategory: { label: string; value: number }[];
  pendingBalances: PendingBalanceRow[];
  movements: MovementRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Compras por proveedor</p>
        <BarList rows={topSuppliers} formatValue={(v) => formatCurrency(v)} />
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Compras por categoría</p>
        <BarList rows={byCategory} formatValue={(v) => formatCurrency(v)} />
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Proveedores con saldo pendiente</p>
        {pendingBalances.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">Ningún proveedor tiene saldo pendiente.</p>
        ) : (
          <div className="space-y-1">
            {pendingBalances.map((row) => (
              <div
                key={row.id}
                className="border-b border-mh-border/70 py-2.5 text-sm last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium text-mh-ink">
                    {row.trade_name}
                  </span>
                  <span className="shrink-0 font-bold text-red-600">
                    {formatCurrency(row.balance)}
                  </span>
                </div>
                <p className="text-xs text-mh-ink-muted">
                  Última compra: {row.last_purchase_date ?? "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Últimos movimientos</p>
        {movements.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">Todavía no hay movimientos registrados.</p>
        ) : (
          <ol className="space-y-4 border-l-2 border-mh-border pl-4">
            {movements.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-mh-pink" />
                <p className="text-sm font-medium text-mh-ink">
                  <span className="font-bold">{m.supplierName}</span> · {m.description}
                </p>
                <p className="text-xs text-mh-ink-muted">{formatDateTime(m.occurred_at)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
