import { createClient } from "@/lib/supabase/server";
import type { SupplierLedgerEntry } from "@/lib/types";
import SupplierLedgerTable from "./SupplierLedgerTable";

export default async function SupplierLedgerTab({
  supplierId,
}: {
  supplierId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_ledger_entries")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <SupplierLedgerTable
      supplierId={supplierId}
      entries={(data ?? []) as SupplierLedgerEntry[]}
    />
  );
}
