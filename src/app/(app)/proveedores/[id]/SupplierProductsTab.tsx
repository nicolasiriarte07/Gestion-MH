import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Product } from "@/lib/types";
import SupplierProductsTable, { type SupplierProductRow } from "./SupplierProductsTable";

export default async function SupplierProductsTab({
  supplierId,
}: {
  supplierId: string;
}) {
  const supabase = await createClient();

  const [
    { data: supplierProducts },
    { data: allProducts },
    { data: categories },
    { data: brands },
  ] = await Promise.all([
    supabase
      .from("supplier_products")
      .select("*, products(*)")
      .eq("supplier_id", supplierId),
    supabase.from("products").select("*").order("description"),
    supabase.from("categories").select("id, name"),
    supabase.from("brands").select("id, name"),
  ]);

  const categoryName = new Map(
    ((categories ?? []) as Category[]).map((c) => [c.id, c.name])
  );
  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));

  const rows: SupplierProductRow[] = (supplierProducts ?? [])
    .filter((sp) => sp.products)
    .map((sp) => {
      const product = sp.products as unknown as Product;
      return {
        id: sp.id,
        product_id: sp.product_id,
        sku: product.sku,
        description: product.description,
        categoryName: product.category_id
          ? (categoryName.get(product.category_id) ?? "Sin categoría")
          : "Sin categoría",
        brandName: product.brand_id
          ? (brandName.get(product.brand_id) ?? "Sin marca")
          : "Sin marca",
        supplier_cost: sp.supplier_cost,
        price_web: product.price_web,
        stock: product.stock,
        last_purchase_date: sp.last_purchase_date,
      };
    });

  const linkedProductIds = new Set(rows.map((r) => r.product_id));
  const availableProducts = ((allProducts ?? []) as Product[]).filter(
    (p) => !linkedProductIds.has(p.id)
  );

  return (
    <SupplierProductsTable
      supplierId={supplierId}
      rows={rows}
      availableProducts={availableProducts}
    />
  );
}
