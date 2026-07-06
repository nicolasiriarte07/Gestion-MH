import { createClient } from "@/lib/supabase/server";
import type { CompetitorSite, Product, ProductCompetitorPrice } from "@/lib/types";
import ProductPicker from "./ProductPicker";
import CompetitorPricesTable, {
  type CompetitorPriceRow,
} from "./CompetitorPricesTable";

export default async function PreciosCompetenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("description");

  let selectedProduct: Product | null = null;
  let initialRows: CompetitorPriceRow[] = [];

  if (productId) {
    const [{ data: product }, { data: rows }, { data: sites }] = await Promise.all([
      supabase.from("products").select("*").eq("id", productId).maybeSingle(),
      supabase
        .from("product_competitor_prices")
        .select("*")
        .eq("product_id", productId),
      supabase.from("competitor_sites").select("*").order("name"),
    ]);

    selectedProduct = (product as Product) ?? null;

    const siteById = new Map(
      ((sites ?? []) as CompetitorSite[]).map((s) => [s.id, s])
    );
    initialRows = ((rows ?? []) as ProductCompetitorPrice[])
      .map((r) => {
        const site = siteById.get(r.site_id);
        return site ? { ...r, site } : null;
      })
      .filter((r): r is CompetitorPriceRow => r !== null)
      .sort((a, b) => a.site.name.localeCompare(b.site.name));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Precios de competencia
        </h1>
        <p className="text-sm text-slate-500">
          Elegí un producto para ver su precio en MercadoLibre, Fravega,
          Hendel, Musimundo, Casa Silvia, Casa Carlitos y Casa del Audio.
        </p>
      </div>

      <ProductPicker
        products={(products ?? []) as Product[]}
        selectedProduct={selectedProduct}
      />

      {selectedProduct && (
        <CompetitorPricesTable
          product={selectedProduct}
          initialRows={initialRows}
        />
      )}
    </div>
  );
}
