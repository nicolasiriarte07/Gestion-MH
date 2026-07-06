import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Supplier } from "@/lib/types";
import SupplierForm from "../../SupplierForm";

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: supplier }, { data: brands }, { data: supplierBrands }] =
    await Promise.all([
      supabase.from("suppliers").select("*").eq("id", id).single(),
      supabase.from("brands").select("id, name").order("name"),
      supabase.from("supplier_brands").select("brand_id").eq("supplier_id", id),
    ]);

  if (!supplier) notFound();

  return (
    <SupplierForm
      mode="edit"
      supplier={supplier as Supplier}
      initialBrandIds={(supplierBrands ?? []).map((sb) => sb.brand_id)}
      brands={(brands ?? []) as Brand[]}
    />
  );
}
