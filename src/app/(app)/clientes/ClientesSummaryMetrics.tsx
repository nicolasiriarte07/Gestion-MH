function formatDays(value: number): string {
  return `${value.toFixed(0)} día(s)`;
}

export default function ClientesSummaryMetrics({
  uniqueCustomers,
  repeatPurchasePct,
  avgRecencyDays,
}: {
  uniqueCustomers: number;
  repeatPurchasePct: number;
  avgRecencyDays: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-2xl font-semibold text-slate-900">
          {uniqueCustomers}
        </p>
        <p className="text-sm font-medium text-slate-700">Clientes únicos</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-2xl font-semibold text-slate-900">
          {repeatPurchasePct.toFixed(1).replace(".", ",")}%
        </p>
        <p className="text-sm font-medium text-slate-700">
          % recompra (más de una compra)
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-2xl font-semibold text-slate-900">
          {formatDays(avgRecencyDays)}
        </p>
        <p className="text-sm font-medium text-slate-700">
          Recencia media entre compras
        </p>
      </div>
    </div>
  );
}
