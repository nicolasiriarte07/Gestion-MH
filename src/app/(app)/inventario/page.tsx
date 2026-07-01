import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit, Category, Subcategory, Product } from "@/lib/types";
import FilterBar from "./FilterBar";
import ProductsTable from "./ProductsTable";

type SearchParams = {
  bu?: string;
  cat?: string;
  web?: string;
  q?: string;
};

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { bu, cat, web, q } = await searchParams;
  const supabase = await createClient();

  const [
    { data: businessUnits },
    { data: categories },
    { data: subcategories },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("subcategories")
      .select("id, category_id, name")
      .order("name"),
  ]);

  let query = supabase
    .from("products")
    .select("*")
    .order("description", { ascending: true });

  if (bu) query = query.eq("business_unit_id", bu);
  if (cat) query = query.eq("category_id", cat);
  if (web === "yes") query = query.eq("is_web", true);
  if (web === "no") query = query.eq("is_web", false);
  if (q) query = query.or(`description.ilike.%${q}%,sku.ilike.%${q}%`);

  const { data: products, error } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500">
            {products?.length ?? 0} producto(s)
          </p>
        </div>
        <Link
          href="/inventario/import"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Importar Excel maestro
        </Link>
      </div>

      <FilterBar
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
      />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Error al cargar productos: {error.message}
        </p>
      )}

      <ProductsTable
        key={`${bu ?? ""}|${cat ?? ""}|${web ?? ""}|${q ?? ""}`}
        initialProducts={(products ?? []) as Product[]}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        subcategories={(subcategories ?? []) as Subcategory[]}
      />
    </div>
  );
}
