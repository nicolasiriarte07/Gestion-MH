import { createClient } from "@/lib/supabase/server";
import type { SupplierLedgerEntry } from "@/lib/types";
import SupplierPaymentsTable from "./SupplierPaymentsTable";

export default async function SupplierPaymentsTab({
  supplierId,
}: {
  supplierId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_ledger_entries")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("kind", "pago")
    .order("entry_date", { ascending: false });

  return (
    <SupplierPaymentsTable
      supplierId={supplierId}
      payments={(data ?? []) as SupplierLedgerEntry[]}
    />
  );
}
