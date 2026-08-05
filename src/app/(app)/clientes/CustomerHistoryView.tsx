import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import Card from "@/components/ds/Card";

const RECEIPT_LETTER_LABELS: Record<string, string> = {
  A: "A (sin IVA)",
  B: "B (consumidor final)",
  X: "X (en negro)",
};

export type HistoryRow = {
  id: string;
  sale_date: string;
  receipt_letter: string | null;
  product_description_raw: string;
  category_raw: string | null;
  quantity: number;
  subtotal_with_iva: number;
  amount_usd: number | null;
  payment_method: string | null;
  business_unit_id: string | null;
};

export default function CustomerHistoryView({
  customerName,
  query,
  history,
  businessUnitName,
}: {
  customerName: string;
  query: string;
  history: HistoryRow[];
  businessUnitName: (id: string | null) => string;
}) {
  if (history.length === 0) {
    return (
      <div className="font-inter rounded-2xl border border-dashed border-mh-border bg-mh-surface p-8 text-center text-sm text-mh-ink-muted">
        No se encontraron ventas para &quot;{customerName}&quot;.
      </div>
    );
  }

  const totals = history.reduce(
    (acc, r) => ({
      ars: acc.ars + r.subtotal_with_iva,
      usd: acc.usd + (r.amount_usd ?? 0),
    }),
    { ars: 0, usd: 0 }
  );
  const dates = [...history.map((r) => r.sale_date)].sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  // Recencia media: promedio de días entre una compra y la siguiente,
  // contando cada fecha de compra una sola vez (varias líneas el mismo
  // día son una sola visita, no varias compras).
  const distinctDates = [...new Set(dates)].sort();
  const gapsDays = distinctDates.slice(1).map((date, i) => {
    const prev = new Date(distinctDates[i]);
    const curr = new Date(date);
    return (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
  });
  const avgRecencyDays = gapsDays.length
    ? gapsDays.reduce((s, n) => s + n, 0) / gapsDays.length
    : null;

  return (
    <div className="font-inter space-y-6">
      <Link
        href={query ? `/clientes?q=${encodeURIComponent(query)}` : "/clientes"}
        className="flex items-center gap-1 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
      >
        <ChevronLeft size={16} />
        Volver a Clientes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.5rem] leading-tight font-extrabold tracking-tight text-mh-ink">
            {customerName}
          </h2>
          <p className="mt-1 text-sm font-medium text-mh-ink-muted">
            Cliente desde {firstDate} · última compra {lastDate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {formatCurrency(totals.ars, "ars")}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">
            Total gastado (ARS)
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {formatCurrency(totals.usd, "usd")}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">
            Total gastado (USD)
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {history.length}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">Líneas de venta</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {formatCurrency(
              history.length ? totals.ars / history.length : 0,
              "ars"
            )}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">
            Ticket promedio (ARS)
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {formatCurrency(
              history.length ? totals.usd / history.length : 0,
              "usd"
            )}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">
            Ticket promedio (USD)
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-extrabold text-mh-ink">
            {avgRecencyDays === null
              ? "—"
              : `${avgRecencyDays.toFixed(0)} día(s)`}
          </p>
          <p className="text-sm font-medium text-mh-ink-muted">Recencia media</p>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mh-border bg-mh-bg text-left text-xs font-semibold text-mh-ink-muted uppercase">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Unidad de negocio</th>
                <th className="px-3 py-3">Cant.</th>
                <th className="px-3 py-3">Monto ARS</th>
                <th className="px-3 py-3">Monto USD</th>
                <th className="px-3 py-3">Forma de pago</th>
                <th className="px-3 py-3">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-mh-border/70 last:border-0 hover:bg-mh-pink-light/40"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-mh-ink-muted">
                    {row.sale_date}
                  </td>
                  <td className="px-3 py-3 font-medium text-mh-ink">{row.product_description_raw}</td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.category_raw || "Sin categoría"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {businessUnitName(row.business_unit_id) || "Sin asignar"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">{row.quantity}</td>
                  <td className="px-3 py-3 whitespace-nowrap font-medium text-mh-ink">
                    {formatCurrency(row.subtotal_with_iva, "ars")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-mh-ink-muted">
                    {formatCurrency(row.amount_usd ?? 0, "usd")}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.payment_method || "Sin dato"}
                  </td>
                  <td className="px-3 py-3 text-mh-ink-muted">
                    {row.receipt_letter
                      ? (RECEIPT_LETTER_LABELS[row.receipt_letter] ??
                        row.receipt_letter)
                      : "Sin dato"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
