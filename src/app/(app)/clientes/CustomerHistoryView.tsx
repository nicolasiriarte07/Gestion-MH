import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
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
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {customerName}
          </h2>
          <p className="text-sm text-slate-500">
            Cliente desde {firstDate} · última compra {lastDate}
          </p>
        </div>
        <Link
          href={query ? `/clientes?q=${encodeURIComponent(query)}` : "/clientes"}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Volver a la búsqueda
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(totals.ars, "ars")}
          </p>
          <p className="text-sm font-medium text-slate-700">
            Total gastado (ARS)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(totals.usd, "usd")}
          </p>
          <p className="text-sm font-medium text-slate-700">
            Total gastado (USD)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {history.length}
          </p>
          <p className="text-sm font-medium text-slate-700">Líneas de venta</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(
              history.length ? totals.ars / history.length : 0,
              "ars"
            )}
          </p>
          <p className="text-sm font-medium text-slate-700">
            Ticket promedio (ARS)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(
              history.length ? totals.usd / history.length : 0,
              "usd"
            )}
          </p>
          <p className="text-sm font-medium text-slate-700">
            Ticket promedio (USD)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">
            {avgRecencyDays === null
              ? "—"
              : `${avgRecencyDays.toFixed(0)} día(s)`}
          </p>
          <p className="text-sm font-medium text-slate-700">Recencia media</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Unidad de negocio</th>
              <th className="px-3 py-2 font-medium">Cant.</th>
              <th className="px-3 py-2 font-medium">Monto ARS</th>
              <th className="px-3 py-2 font-medium">Monto USD</th>
              <th className="px-3 py-2 font-medium">Forma de pago</th>
              <th className="px-3 py-2 font-medium">Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-1.5">
                  {row.sale_date}
                </td>
                <td className="px-3 py-1.5">{row.product_description_raw}</td>
                <td className="px-3 py-1.5">
                  {row.category_raw || "Sin categoría"}
                </td>
                <td className="px-3 py-1.5">
                  {businessUnitName(row.business_unit_id) || "Sin asignar"}
                </td>
                <td className="px-3 py-1.5">{row.quantity}</td>
                <td className="whitespace-nowrap px-3 py-1.5">
                  {formatCurrency(row.subtotal_with_iva, "ars")}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5">
                  {formatCurrency(row.amount_usd ?? 0, "usd")}
                </td>
                <td className="px-3 py-1.5">
                  {row.payment_method || "Sin dato"}
                </td>
                <td className="px-3 py-1.5">
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
    </>
  );
}
