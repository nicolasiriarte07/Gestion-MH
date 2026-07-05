import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessUnit,
  Category,
  Subcategory,
  Brand,
  Product,
} from "@/lib/types";
import FilterBar from "./FilterBar";
import ProductsTable from "./ProductsTable";
import LowStockAlerts, { type LowStockRow } from "./LowStockAlerts";

const LOW_STOCK_THRESHOLD = 5;
const VELOCITY_WINDOW_DAYS = 90;
const LOW_STOCK_ALERT_LIMIT = 15;

type SearchParams = {
  bu?: string;
  cat?: string;
  brand?: string;
  web?: string;
  q?: string;
  stockMax?: string;
};

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { bu, cat, brand, web, q, stockMax } = await searchParams;
  const supabase = await createClient();

  const [
    { data: businessUnits },
    { data: categories },
    { data: subcategories },
    { data: brands },
    { data: lowStockProducts },
    { data: velocityData },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("subcategories")
      .select("id, category_id, name")
      .order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase
      .from("products")
      .select("*")
      .lte("stock", LOW_STOCK_THRESHOLD),
    supabase.rpc("product_sales_velocity", { days: VELOCITY_WINDOW_DAYS }),
  ]);

  let query = supabase
    .from("products")
    .select("*")
    .order("description", { ascending: true });

  if (bu) query = query.eq("business_unit_id", bu);
  if (cat) query = query.eq("category_id", cat);
  if (brand) query = query.eq("brand_id", brand);
  if (web === "yes") query = query.eq("is_web", true);
  if (web === "no") query = query.eq("is_web", false);
  if (q) query = query.or(`description.ilike.%${q}%,sku.ilike.%${q}%`);
  if (stockMax) query = query.lte("stock", Number(stockMax));

  const { data: products, error } = await query;

  const velocityByProduct = new Map(
    ((velocityData ?? []) as { product_id: string; units_sold: number }[]).map(
      (r) => [r.product_id, r.units_sold]
    )
  );
  const lowStockRows: LowStockRow[] = ((lowStockProducts ?? []) as Product[])
    .map((p) => ({ ...p, units_sold_90d: velocityByProduct.get(p.id) ?? 0 }))
    .sort((a, b) => b.units_sold_90d - a.units_sold_90d)
    .slice(0, LOW_STOCK_ALERT_LIMIT);

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
          className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Importar Excel maestro
        </Link>
      </div>

      <LowStockAlerts rows={lowStockRows} brands={(brands ?? []) as Brand[]} />

      <FilterBar
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        brands={(brands ?? []) as Brand[]}
      />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Error al cargar productos: {error.message}
        </p>
      )}

      <ProductsTable
        key={`${bu ?? ""}|${cat ?? ""}|${brand ?? ""}|${web ?? ""}|${q ?? ""}`}
        initialProducts={(products ?? []) as Product[]}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        subcategories={(subcategories ?? []) as Subcategory[]}
        brands={(brands ?? []) as Brand[]}
      />
    </div>
  );
}
