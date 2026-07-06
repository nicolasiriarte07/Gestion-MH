import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit, Category, Brand, Product } from "@/lib/types";
import type { Metric, Currency } from "../ventas/MetricControls";
import type { BreakdownRow } from "../ventas/BreakdownCard";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import FilterBar from "./FilterBar";
import ProductsTable from "./ProductsTable";
import LowStockAlerts from "./LowStockAlerts";
import InventoryMetrics from "./InventoryMetrics";
import StockCharts from "./StockCharts";
import StockMetricToggle, { type StockMetric } from "./StockMetricToggle";

const LOW_STOCK_THRESHOLD = 1;

type SearchParams = {
  bu?: string;
  cat?: string;
  brand?: string;
  web?: string;
  q?: string;
  stockMax?: string;
  stockMetric?: string;
};

function groupStock(
  products: Product[],
  keyOf: (p: Product) => string | null,
  nameOf: (id: string) => string,
  unassignedLabel: string
): BreakdownRow[] {
  const totals = new Map<string, { units: number; money: number }>();
  for (const p of products) {
    const key = keyOf(p) ?? "";
    const cur = totals.get(key) ?? { units: 0, money: 0 };
    cur.units += p.stock;
    cur.money += p.stock * p.cost;
    totals.set(key, cur);
  }
  return [...totals.entries()].map(([key, v]) => ({
    label: key ? nameOf(key) : unassignedLabel,
    line_count: v.units,
    total_ars: v.money,
    total_usd: 0,
  }));
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { bu, cat, brand, web, q, stockMax, stockMetric } = await searchParams;
  const supabase = await createClient();

  const [
    { data: businessUnits },
    { data: categories },
    { data: brands },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    fetchAllRows<Product>((from, to) =>
      supabase
        .from("products")
        .select("*")
        .lte("stock", LOW_STOCK_THRESHOLD)
        .order("description", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);

  const { data: products, error } = await fetchAllRows<Product>((from, to) => {
    let query = supabase
      .from("products")
      .select("*")
      .order("description", { ascending: true })
      .order("id", { ascending: true });

    if (bu) query = query.eq("business_unit_id", bu);
    if (cat) query = query.eq("category_id", cat);
    if (brand) query = query.eq("brand_id", brand);
    if (web === "yes") query = query.eq("is_web", true);
    if (web === "no") query = query.eq("is_web", false);
    if (q) query = query.or(`description.ilike.%${q}%,sku.ilike.%${q}%`);
    if (stockMax) query = query.lte("stock", Number(stockMax));

    return query.range(from, to);
  });

  const lowStockRows = (lowStockProducts ?? []) as Product[];
  const filteredProducts = (products ?? []) as Product[];

  const activeStockMetric: StockMetric =
    stockMetric === "dinero" ? "dinero" : "unidades";
  const chartMetric: Metric =
    activeStockMetric === "dinero" ? "facturacion" : "ventas";
  const chartCurrency: Currency = "ars";

  const businessUnitName = new Map(
    ((businessUnits ?? []) as BusinessUnit[]).map((b) => [b.id, b.name])
  );
  const categoryName = new Map(
    ((categories ?? []) as Category[]).map((c) => [c.id, c.name])
  );
  const brandName = new Map(
    ((brands ?? []) as Brand[]).map((b) => [b.id, b.name])
  );

  const stockByBusinessUnit = groupStock(
    filteredProducts,
    (p) => p.business_unit_id,
    (id) => businessUnitName.get(id) ?? "Desconocida",
    "Sin asignar"
  );
  const stockByCategory = groupStock(
    filteredProducts,
    (p) => p.category_id,
    (id) => categoryName.get(id) ?? "Desconocida",
    "Sin categoría"
  );
  const stockByBrand = groupStock(
    filteredProducts,
    (p) => p.brand_id,
    (id) => brandName.get(id) ?? "Desconocida",
    "Sin marca"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500">
            {filteredProducts.length} producto(s)
          </p>
        </div>
        <Link
          href="/inventario/import"
          className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Importar Excel maestro
        </Link>
      </div>

      <InventoryMetrics products={filteredProducts} />

      <FilterBar
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        brands={(brands ?? []) as Brand[]}
      />

      <LowStockAlerts rows={lowStockRows} brands={(brands ?? []) as Brand[]} />

      <div className="flex justify-end">
        <StockMetricToggle value={activeStockMetric} />
      </div>

      <StockCharts
        stockByBusinessUnit={stockByBusinessUnit}
        stockByCategory={stockByCategory}
        stockByBrand={stockByBrand}
        metric={chartMetric}
        currency={chartCurrency}
      />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Error al cargar productos: {error.message}
        </p>
      )}

      <ProductsTable
        key={`${bu ?? ""}|${cat ?? ""}|${brand ?? ""}|${web ?? ""}|${q ?? ""}`}
        initialProducts={filteredProducts}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        brands={(brands ?? []) as Brand[]}
      />
    </div>
  );
}
