import { MapPin } from "lucide-react";
import Card from "@/components/ds/Card";
import BarList from "@/components/ds/BarList";
import { formatCurrency } from "@/lib/currency";

export type InactiveClienteRow = {
  customer_name: string;
  last_sale_date: string;
  days_since: number;
  total_ars: number;
};

export type MovementRow = {
  id: string;
  type: "nuevo" | "compra";
  customer_name: string;
  date: string;
  detail: string;
};

function MovementLine({ m }: { m: MovementRow }) {
  return (
    <li className="relative">
      <span
        className={`absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full ${
          m.type === "nuevo" ? "bg-mh-blue" : "bg-mh-pink"
        }`}
      />
      <p className="text-sm font-medium text-mh-ink">
        <span className="font-bold">{m.customer_name}</span> · {m.detail}
      </p>
      <p className="text-xs text-mh-ink-muted">{m.date}</p>
    </li>
  );
}

export default function ClientesBottomDashboard({
  topClientes,
  inactiveClientes,
  movements,
}: {
  topClientes: { label: string; value: number }[];
  inactiveClientes: InactiveClienteRow[];
  movements: MovementRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Clientes con mayor facturación</p>
        <BarList rows={topClientes} formatValue={(v) => formatCurrency(v)} />
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Clientes por localidad</p>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <MapPin size={24} className="text-slate-300" />
          <p className="max-w-[26ch] text-sm text-mh-ink-muted">
            No hay datos de localidad cargados: las ventas importadas no traen la ciudad del
            cliente.
          </p>
        </div>
      </Card>

      <Card padding="sm">
        <p className="mb-4 text-sm font-bold text-mh-ink">Clientes inactivos</p>
        {inactiveClientes.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">No hay clientes inactivos hace más de 90 días.</p>
        ) : (
          <div className="space-y-1">
            {inactiveClientes.map((row) => (
              <div
                key={row.customer_name}
                className="border-b border-mh-border/70 py-2.5 text-sm last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium text-mh-ink">
                    {row.customer_name}
                  </span>
                  <span className="shrink-0 font-bold text-mh-ink">
                    {formatCurrency(row.total_ars)}
                  </span>
                </div>
                <p className="text-xs text-mh-ink-muted">
                  Última compra: {row.last_sale_date} · {row.days_since} día(s) sin comprar
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
              <MovementLine key={m.id} m={m} />
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
