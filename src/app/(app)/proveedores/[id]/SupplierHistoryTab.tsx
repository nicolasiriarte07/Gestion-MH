import { createClient } from "@/lib/supabase/server";
import type { SupplierHistoryEntry } from "@/lib/types";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SupplierHistoryTab({
  supplierId,
}: {
  supplierId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_history")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("occurred_at", { ascending: false });

  const entries = (data ?? []) as SupplierHistoryEntry[];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        Todavía no hay eventos registrados para este proveedor.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <ol className="space-y-4 border-l-2 border-slate-100 pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-brand" />
            <p className="text-sm text-slate-900">{entry.description}</p>
            <p className="text-xs text-slate-500">
              {formatDateTime(entry.occurred_at)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
