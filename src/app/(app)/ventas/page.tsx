import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/types";

async function countByStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  status: MatchStatus
) {
  const { count } = await supabase
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("match_status", status);
  return count ?? 0;
}

export default async function VentasPage() {
  const supabase = await createClient();

  const [{ count: total }, pending, confirmed, rejected, noMatch] =
    await Promise.all([
      supabase.from("sale_items").select("id", { count: "exact", head: true }),
      countByStatus(supabase, "pending"),
      countByStatus(supabase, "confirmed"),
      countByStatus(supabase, "rejected"),
      countByStatus(supabase, "no_match"),
    ]);

  const totalRows = total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">
            {totalRows} línea(s) de venta importadas
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ventas/revisar"
            className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Revisar coincidencias
          </Link>
          <Link
            href="/ventas/import"
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Importar Excel
          </Link>
        </div>
      </div>

      {totalRows === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Todavía no importaste ningún histórico de ventas.{" "}
          <Link href="/ventas/import" className="text-brand underline">
            Importar ahora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Vinculadas"
            value={confirmed}
            hint="Producto identificado (por código o confirmado a mano)"
          />
          <StatCard
            label="Pendientes de revisión"
            value={pending}
            hint="Necesitan que confirmes el producto"
            highlight
          />
          <StatCard
            label="Sin coincidencia"
            value={noMatch}
            hint="Marcadas manualmente como sin producto en el catálogo"
          />
          <StatCard
            label="Rechazadas"
            value={rejected}
            hint="Sugerencia descartada a mano"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-4 ${highlight && value > 0 ? "border-brand bg-brand-light" : "border-slate-200 bg-white"}`}
    >
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
