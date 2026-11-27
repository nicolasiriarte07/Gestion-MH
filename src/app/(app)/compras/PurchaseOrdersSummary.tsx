import { formatCurrency } from "@/lib/currency";
import type { PurchaseOrderRow } from "./purchaseOrderRow";
import { arrivalLight, daysBetweenISO } from "./purchaseOrderStages";

function isThisMonth(iso: string, today: string): boolean {
  return iso.slice(0, 7) === today.slice(0, 7);
}

export default function PurchaseOrdersSummary({
  rows,
  today,
}: {
  rows: PurchaseOrderRow[];
  today: string;
}) {
  const comprometido = rows
    .filter((o) => o.estado !== "recibido")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const recibidoDelMes = rows
    .filter((o) => o.estado === "recibido" && o.receivedAt && isThisMonth(o.receivedAt, today))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const atrasados = rows.filter((o) => arrivalLight(o, today) === "rojo").length;

  const proximasLlegadas = rows.filter((o) => {
    if (o.estado === "recibido" || !o.arrival_date) return false;
    const diff = daysBetweenISO(today, o.arrival_date);
    return diff >= 0 && diff <= 7;
  }).length;

  const tiles = [
    { label: "Comprometido (no recibido)", value: formatCurrency(comprometido), tone: "text-mh-ink" },
    { label: "Recibido este mes", value: formatCurrency(recibidoDelMes), tone: "text-emerald-600" },
    { label: "Pedidos atrasados", value: String(atrasados), tone: atrasados > 0 ? "text-red-600" : "text-mh-ink" },
    { label: "Llegan en 7 días", value: String(proximasLlegadas), tone: "text-mh-blue" },
  ];

  return (
    <div className="font-inter grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-mh-border bg-mh-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <p className={`text-xl font-extrabold ${t.tone}`}>{t.value}</p>
          <p className="mt-0.5 text-xs font-medium text-mh-ink-muted">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
