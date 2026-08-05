import { createClient } from "@/lib/supabase/server";
import type { SupplierHistoryEntry } from "@/lib/types";
import Card from "@/components/ds/Card";

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
      <div className="font-inter rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center text-sm text-mh-ink-muted">
        Todavía no hay eventos registrados para este proveedor.
      </div>
    );
  }

  return (
    <Card padding="sm" className="font-inter">
      <ol className="space-y-4 border-l-2 border-mh-border pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-mh-pink" />
            <p className="text-sm font-medium text-mh-ink">{entry.description}</p>
            <p className="text-xs text-mh-ink-muted">
              {formatDateTime(entry.occurred_at)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
