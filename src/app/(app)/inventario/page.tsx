import { createClient } from "@/lib/supabase/server";
import type { BusinessUnit, Category, Subcategory, Brand, Product } from "@/lib/types";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import InventarioHeader from "./InventarioHeader";
import InventarioKpis from "./InventarioKpis";
import InventarioAlerts from "./InventarioAlerts";
import InventarioFilterBar from "./InventarioFilterBar";
import InventarioTable from "./InventarioTable";
import InventarioBottomGrid, { type ImmobilizedRow } from "./InventarioBottomGrid";
import type { BarListRow } from "@/components/ds/BarList";

const LOW_STOCK_THRESHOLD = 1;

type SearchParams = {
  bu?: string;
  cat?: string;
  brand?: string;
  web?: string;
  q?: string;
  stockMin?: string;
  stockMax?: string;
  priceWebMin?: string;
  priceWebMax?: string;
};

function groupBy(
  products: Product[],
  keyOf: (p: Product) => string | null,
  nameOf: (id: string) => string,
  unassignedLabel: string
): { units: BarListRow[]; money: BarListRow[] } {
  const totals = new Map<string, { units: number; money: number }>();
  for (const p of products) {
    const key = keyOf(p) ?? "";
    const cur = totals.get(key) ?? { units: 0, money: 0 };
    cur.units += p.stock;
    cur.money += p.stock * p.price_cash;
    totals.set(key, cur);
  }
  const entries = [...totals.entries()].map(([key, v]) => ({
    label: key ? nameOf(key) : unassignedLabel,
    units: v.units,
    money: v.money,
  }));
  return {
    units: entries
      .map((e) => ({ label: e.label, value: e.units }))
      .sort((a, b) => b.value - a.value),
    money: entries
      .map((e) => ({ label: e.label, value: e.money }))
      .sort((a, b) => b.value - a.value),
  };
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { bu, cat, brand, web, q, stockMin, stockMax, priceWebMin, priceWebMax } =
    await searchParams;
  const supabase = await createClient();

  const [
    { data: businessUnits },
    { data: categories },
    { data: subcategories },
    { data: brands },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("subcategories").select("id, category_id, name").order("name"),
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
    if (stockMin) query = query.gte("stock", Number(stockMin));
    if (stockMax) query = query.lte("stock", Number(stockMax));
    if (priceWebMin) query = query.gte("price_web", Number(priceWebMin));
    if (priceWebMax) query = query.lte("price_web", Number(priceWebMax));

    return query.range(from, to);
  });

  const lowStockRows = (lowStockProducts ?? []) as Product[];
  const webOutOfStockRows = lowStockRows.filter((p) => p.is_web && p.stock === 0);
  const filteredProducts = (products ?? []) as Product[];

  const categoryName = new Map(
    ((categories ?? []) as Category[]).map((c) => [c.id, c.name])
  );
  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));

  // Los 5 KPIs y la grilla inferior se calculan sobre `filteredProducts`
  // (respetan los filtros de la barra de búsqueda), igual que ya hacían
  // InventoryMetrics/StockCharts antes de este rediseño. Las 2 alertas
  // usan `lowStockRows`/`webOutOfStockRows` (siempre globales, sin
  // filtrar), también igual que antes.
  const inventoryValue = filteredProducts.reduce(
    (sum, p) => sum + p.stock * p.price_cash,
    0
  );
  const withCompleteMargin = filteredProducts.filter(
    (p) => p.cost > 0 && p.price_web > 0
  );
  const avgMarkup =
    withCompleteMargin.length > 0
      ? (withCompleteMargin.reduce(
          (sum, p) => sum + (p.price_web - p.cost) / p.cost,
          0
        ) /
          withCompleteMargin.length) *
        100
      : 0;

  const { units: stockByCategory } = groupBy(
    filteredProducts,
    (p) => p.category_id,
    (id) => categoryName.get(id) ?? "Desconocida",
    "Sin categoría"
  );
  const { money: stockByBrand } = groupBy(
    filteredProducts,
    (p) => p.brand_id,
    (id) => brandName.get(id) ?? "Desconocida",
    "Sin marca"
  );

  const topImmobilized: ImmobilizedRow[] = [...filteredProducts]
    .map((p) => ({
      description: p.description,
      stock: p.stock,
      value: p.stock * p.price_cash,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="font-inter space-y-10">
      <InventarioHeader
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        subcategories={(subcategories ?? []) as Subcategory[]}
        brands={(brands ?? []) as Brand[]}
      />

      <InventarioKpis
        productCount={filteredProducts.length}
        inventoryValue={inventoryValue}
        lowStockCount={lowStockRows.filter((p) => p.stock === 1).length}
        outOfStockCount={lowStockRows.filter((p) => p.stock === 0).length}
        avgMarkup={avgMarkup}
      />

      <InventarioAlerts
        criticalCount={webOutOfStockRows.length}
        lowStockCount={lowStockRows.filter((p) => p.stock === 1).length}
      />

      <InventarioFilterBar
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        brands={(brands ?? []) as Brand[]}
      />

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error al cargar productos: {error.message}
        </p>
      )}

      <InventarioTable
        key={`${bu ?? ""}|${cat ?? ""}|${brand ?? ""}|${web ?? ""}|${q ?? ""}|${stockMin ?? ""}|${stockMax ?? ""}|${priceWebMin ?? ""}|${priceWebMax ?? ""}`}
        initialProducts={filteredProducts}
        businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        categories={(categories ?? []) as Category[]}
        subcategories={(subcategories ?? []) as Subcategory[]}
        brands={(brands ?? []) as Brand[]}
      />

      <InventarioBottomGrid
        stockByCategory={stockByCategory}
        stockByBrand={stockByBrand}
        topImmobilized={topImmobilized}
      />
    </div>
  );
}
