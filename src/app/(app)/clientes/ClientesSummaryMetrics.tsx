import Card from "@/components/ds/Card";

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
    <div className="font-inter grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card padding="sm">
        <p className="text-2xl font-extrabold text-mh-ink">{uniqueCustomers}</p>
        <p className="text-sm font-medium text-mh-ink-muted">Clientes únicos</p>
      </Card>
      <Card padding="sm">
        <p className="text-2xl font-extrabold text-mh-ink">
          {repeatPurchasePct.toFixed(1).replace(".", ",")}%
        </p>
        <p className="text-sm font-medium text-mh-ink-muted">
          % recompra (más de una compra)
        </p>
      </Card>
      <Card padding="sm">
        <p className="text-2xl font-extrabold text-mh-ink">{formatDays(avgRecencyDays)}</p>
        <p className="text-sm font-medium text-mh-ink-muted">
          Recencia media entre compras
        </p>
      </Card>
    </div>
  );
}
