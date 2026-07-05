import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { bestMatch } from "@/lib/similarity";
import type { BusinessUnit, Product } from "@/lib/types";
import MatchReview, { type PendingGroup } from "./MatchReview";

type PendingRow = {
  product_description_raw: string;
  business_unit_id: string | null;
  row_count: number;
};

export default async function RevisarPage() {
  const supabase = await createClient();

  const [{ data: pendingGroups }, { data: products }, { data: businessUnits }] =
    await Promise.all([
      supabase.rpc("pending_sale_descriptions"),
      supabase
        .from("products")
        .select("id, sku, description, business_unit_id"),
      supabase.from("business_units").select("id, name"),
    ]);

  const productList = (products ?? []) as Pick<
    Product,
    "id" | "sku" | "description" | "business_unit_id"
  >[];

  const groups: PendingGroup[] = ((pendingGroups ?? []) as PendingRow[]).map(
    (g) => {
      const candidates = g.business_unit_id
        ? productList.filter((p) => p.business_unit_id === g.business_unit_id)
        : productList;

      const match = bestMatch(g.product_description_raw, candidates, (p) => p.description);

      return {
        description: g.product_description_raw,
        businessUnitId: g.business_unit_id,
        count: g.row_count,
        suggestedProductId: match && match.score >= 0.3 ? match.item.id : null,
        suggestedScore: match ? match.score : null,
      };
    }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Revisar coincidencias
          </h1>
          <p className="text-sm text-slate-500">
            {groups.length} descripción(es) distinta(s) pendiente(s), sobre
            un total de{" "}
            {groups.reduce((sum, g) => sum + g.count, 0)} línea(s) de venta.
          </p>
        </div>
        <Link
          href="/ventas"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Volver a ventas
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay descripciones pendientes de revisión.
        </div>
      ) : (
        <MatchReview
          groups={groups}
          products={productList}
          businessUnits={(businessUnits ?? []) as BusinessUnit[]}
        />
      )}
    </div>
  );
}
